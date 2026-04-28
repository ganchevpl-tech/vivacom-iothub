// Auth Audit Logger — Zero Trust event recording.
// Called from the client after login/signout/password changes/MFA events.
// Inserts rows into public.auth_audit_log using the service role key
// (RLS blocks direct inserts from authenticated users).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_EVENT_TYPES = new Set([
  'login_success',
  'login_failed',
  'logout',
  'password_changed',
  'password_reset_requested',
  'mfa_enrolled',
  'mfa_unenrolled',
  'mfa_challenge_success',
  'mfa_challenge_failed',
  'role_changed',
  'session_expired',
  'suspicious_activity',
]);

// Per-IP rate limit: 30 events / minute (login spam protection)
const ipBuckets = new Map<string, { count: number; resetAt: number }>();
function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const b = ipBuckets.get(ip);
  if (!b || now > b.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (b.count >= 30) return false;
  b.count++;
  return true;
}

interface AuditPayload {
  event_type: string;
  email?: string;
  success?: boolean;
  metadata?: Record<string, unknown>;
}

function validatePayload(body: unknown): AuditPayload | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.event_type !== 'string' || !ALLOWED_EVENT_TYPES.has(b.event_type)) return null;
  if (b.email !== undefined && (typeof b.email !== 'string' || b.email.length > 255)) return null;
  if (b.success !== undefined && typeof b.success !== 'boolean') return null;
  if (b.metadata !== undefined && (typeof b.metadata !== 'object' || b.metadata === null)) return null;

  // Strip metadata to safe size
  let metadata: Record<string, unknown> | undefined;
  if (b.metadata) {
    const json = JSON.stringify(b.metadata);
    if (json.length > 4000) return null;
    metadata = b.metadata as Record<string, unknown>;
  }

  return {
    event_type: b.event_type,
    email: b.email as string | undefined,
    success: b.success as boolean | undefined,
    metadata,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Best-effort IP for rate limiting + audit
  const ip = req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown';

  if (!checkIpRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate JWT — only signed-in users can log audit events for themselves
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await (userClient.auth as any).getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId: string = claimsData.claims.sub;
  const userEmail: string | undefined = claimsData.claims.email;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = validatePayload(body);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Insert with service role (bypasses RLS)
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;

  const { error: insertError } = await adminClient.from('auth_audit_log').insert({
    user_id: userId,
    email: payload.email ?? userEmail ?? null,
    event_type: payload.event_type,
    success: payload.success ?? true,
    ip_address: ip !== 'unknown' ? ip : null,
    user_agent: userAgent,
    metadata: payload.metadata ?? {},
  });

  if (insertError) {
    console.error('[auth-audit] Insert failed:', insertError.message);
    return new Response(JSON.stringify({ error: 'Failed to log event' }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

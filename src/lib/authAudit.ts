import { supabase } from '@/integrations/supabase/client';

export type AuthAuditEvent =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_changed'
  | 'password_reset_requested'
  | 'mfa_enrolled'
  | 'mfa_unenrolled'
  | 'mfa_challenge_success'
  | 'mfa_challenge_failed'
  | 'role_changed'
  | 'session_expired'
  | 'suspicious_activity';

interface AuditOptions {
  email?: string;
  success?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Logs an auth-related event to the server-side audit trail.
 * Failures are silenced — auditing must never break the user flow.
 */
export async function logAuthEvent(event_type: AuthAuditEvent, opts: AuditOptions = {}): Promise<void> {
  try {
    await supabase.functions.invoke('auth-audit', {
      method: 'POST',
      body: { event_type, ...opts },
    });
  } catch (err) {
    // Silent — never block UX on audit failure
    if (import.meta.env.DEV) console.warn('[auth-audit]', err);
  }
}

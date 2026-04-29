import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

let cachedSensorResponse: { data: any; timestamp: number } | null = null;
let cachedFleetResponse: { data: any; timestamp: number } | null = null;
const CACHE_DURATION_MS = 30_000;

// In-memory rate limiter: max 60 requests per user per minute
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(userId);
  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count++;
  return true;
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function mapDeviceToVehicle(device: any) {
  const t = device.telemetry || {};
  const lat = t["position.latitude"]?.value ?? null;
  const lng = t["position.longitude"]?.value ?? null;
  const speed = t["position.speed"]?.value ?? 0;
  const heading = t["position.direction"]?.value ?? 0;
  const battery = t["battery.voltage"]?.value ?? t["external.powersource.voltage"]?.value ?? null;
  const ignition = t["engine.ignition.status"]?.value ?? false;
  const ts = t["position.latitude"]?.ts ?? t["timestamp"]?.value ?? null;

  // Светофар логика:
  //  🟢 moving       — движи се (скорост > 5 km/h)
  //  🟡 idle         — спрян, но двигателят е запален (ключ в гнездото)
  //  🔴 parked-short — спрян и двигателят е изгасен (< 30 мин)
  //  🔴 parked-long  — спрян и двигателят е изгасен (> 30 мин)
  //  ⚫ offline      — няма данни > 1 час
  let status: string = "offline";
  const ageSec = ts ? (Date.now() / 1000 - ts) : Infinity;
  if (ageSec > 3600) status = "offline";
  else if (speed > 5) status = "moving";
  else if (ignition) status = "idle";          // двигател работи, колата стои
  else if (ageSec < 1800) status = "parked-short"; // изгасен, наскоро
  else status = "parked-long";                  // изгасен, отдавна

  return {
    id: String(device.id),
    plate: device.name || `Device ${device.id}`,
    name: device.name || `Unit ${device.id}`,
    make: device.configuration?.device_type_name?.split(" ")[0] ?? "Unknown",
    model: device.configuration?.device_type_name ?? "GPS Tracker",
    driver: "—",
    status,
    latitude: lat,
    longitude: lng,
    speed,
    heading,
    battery,
    signal: t["gsm.signal.level"]?.value ?? null,
    fuel: t["fuel.level"]?.value ?? null,
    address: "—",
    mileageToday: 0,
    mileageTotal: t["vehicle.mileage"]?.value ?? 0,
    statusDuration: 0,
    lastUpdate: ts ? new Date(ts * 1000).toISOString() : null,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ============= ZERO TRUST: verify JWT before doing anything =============
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized: missing bearer token' }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await (supabase.auth as any).getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub;

  // Rate limit per user
  if (!checkRateLimit(userId)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "sensors";

  try {
    const FLESPI_TOKEN = Deno.env.get("FLESPI_TOKEN");
    if (!FLESPI_TOKEN) {
      return new Response(JSON.stringify({ error: "Flespi token not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = {
      "Authorization": `FlespiToken ${FLESPI_TOKEN}`,
      "Content-Type": "application/json",
    };

    const now = Date.now();

    if (type === "fleet") {
      if (cachedFleetResponse && (now - cachedFleetResponse.timestamp < CACHE_DURATION_MS)) {
        return new Response(JSON.stringify(cachedFleetResponse.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const devicesRes = await fetchWithTimeout(
        "https://flespi.io/gw/devices/all?fields=id%2Cname%2Cconfiguration%2Ctelemetry",
        { method: "GET", headers },
        8000
      );

      if (!devicesRes.ok) {
        const errText = await devicesRes.text();
        return new Response(JSON.stringify({
          success: false, error: "Failed to fetch devices",
          status: devicesRes.status, details: errText,
        }), {
          status: devicesRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const devicesData = await devicesRes.json();
      const devices = Array.isArray(devicesData.result) ? devicesData.result : [];
      const vehicles = devices
        .map(mapDeviceToVehicle)
        .filter((v: any) => v.latitude !== null && v.longitude !== null);

      const result = { success: true, source: "devices", count: vehicles.length, vehicles };
      cachedFleetResponse = { data: result, timestamp: Date.now() };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (cachedSensorResponse && (now - cachedSensorResponse.timestamp < CACHE_DURATION_MS)) {
      return new Response(JSON.stringify(cachedSensorResponse.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const response = await fetchWithTimeout(
        "https://flespi.io/gw/channels/1355531/messages?data=%7B%22count%22%3A1%7D",
        { method: "GET", headers }
      );
      if (response.ok) {
        const data = await response.json();
        const result = { success: true, source: "messages", data };
        cachedSensorResponse = { data: result, timestamp: Date.now() };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (_e) { /* fall through */ }

    const devResponse = await fetchWithTimeout(
      "https://flespi.io/gw/devices/all/telemetry/all",
      { method: "GET", headers }
    );

    if (!devResponse.ok) {
      const errText = await devResponse.text();
      return new Response(JSON.stringify({
        error: "Failed to fetch telemetry",
        status: devResponse.status, details: errText,
      }), {
        status: devResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const devData = await devResponse.json();
    const result = { success: true, source: "devices", data: devData };
    cachedSensorResponse = { data: result, timestamp: Date.now() };
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error('[flespi-telemetry] Error:', msg);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FLESPI_TOKEN = Deno.env.get("FLESPI_TOKEN");
    if (!FLESPI_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Flespi token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers = {
      "Authorization": `FlespiToken ${FLESPI_TOKEN}`,
      "Content-Type": "application/json",
    };

    // Try channel messages first
    try {
      const response = await fetchWithTimeout(
        "https://flespi.io/gw/channels/1355531/messages?data=%7B%22count%22%3A1%7D",
        { method: "GET", headers }
      );

      if (response.ok) {
        const data = await response.json();
        return new Response(
          JSON.stringify({ success: true, source: "messages", data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (e) {
      // Channel fetch failed or timed out, try devices
    }

    // Fallback: device telemetry
    const devResponse = await fetchWithTimeout(
      "https://flespi.io/gw/devices/all/telemetry/all",
      { method: "GET", headers }
    );

    if (!devResponse.ok) {
      const errText = await devResponse.text();
      return new Response(
        JSON.stringify({ error: "Failed to fetch telemetry", status: devResponse.status, details: errText }),
        { status: devResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const devData = await devResponse.json();
    return new Response(
      JSON.stringify({ success: true, source: "devices", data: devData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg, success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

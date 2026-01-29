import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FLESPI_TOKEN = Deno.env.get("FLESPI_TOKEN");
    
    if (!FLESPI_TOKEN) {
      console.error("FLESPI_TOKEN is not configured");
      return new Response(
        JSON.stringify({ error: "Flespi token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try the messages endpoint first for telemetry data
    const messagesUrl = "https://flespi.io/gw/channels/all/messages?data=%7B%22count%22%3A100%7D";
    
    console.log("Fetching from Flespi API...");
    
    const response = await fetch(messagesUrl, {
      method: "GET",
      headers: {
        "Authorization": `FlespiToken ${FLESPI_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Flespi API error:", response.status, errorText);
      
      // Try alternative endpoint - device telemetry
      const devicesUrl = "https://flespi.io/gw/devices/all/telemetry/all";
      const devicesResponse = await fetch(devicesUrl, {
        method: "GET",
        headers: {
          "Authorization": `FlespiToken ${FLESPI_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!devicesResponse.ok) {
        const devicesError = await devicesResponse.text();
        console.error("Flespi devices API error:", devicesResponse.status, devicesError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to fetch telemetry", 
            status: devicesResponse.status,
            details: devicesError 
          }),
          { status: devicesResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const devicesData = await devicesResponse.json();
      console.log("Flespi devices telemetry fetched:", JSON.stringify(devicesData).substring(0, 500));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          source: "devices",
          data: devicesData 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Flespi messages fetched:", JSON.stringify(data).substring(0, 500));

    return new Response(
      JSON.stringify({ 
        success: true, 
        source: "messages",
        data: data 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching Flespi data:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

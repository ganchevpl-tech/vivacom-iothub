// MQTT Bridge — заготовка за Matter / Zigbee / Z-Wave сдвояване през MQTT gateway.
// В демо режим връща симулиран успех. В production трябва да публикува на MQTT broker.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface PairBody {
  action: 'pair' | 'unpair' | 'list';
  protocol: 'matter' | 'zigbee' | 'z-wave';
  pairingCode?: string;
  deviceName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as PairBody;
    if (!body?.action || !body?.protocol) {
      return new Response(JSON.stringify({ error: 'action and protocol required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // TODO: Свържи с реален MQTT broker (Mosquitto / Flespi MQTT) за командите
    // mqtt publish: vivacom/gateway/pair { protocol, code, name }
    const result = {
      success: true,
      protocol: body.protocol,
      deviceName: body.deviceName ?? 'Unnamed device',
      action: body.action,
      gateway: 'flespi-mqtt',
      message: `Симулирано сдвояване чрез ${body.protocol}. Свържете истински MQTT broker за production.`,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

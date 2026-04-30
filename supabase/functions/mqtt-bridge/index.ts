// MQTT Bridge — заготовка за Matter / Zigbee / Z-Wave сдвояване през MQTT gateway.
// В демо режим връща симулиран успех. В production трябва да публикува на MQTT broker.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface PairBody {
  action: 'pair' | 'unpair' | 'list' | 'command';
  protocol?: 'matter' | 'zigbee' | 'z-wave';
  pairingCode?: string;
  deviceName?: string;
  topic?: string;
  command?: string;
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
    if (!body?.action) {
      return new Response(JSON.stringify({ error: 'action required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Remote command path: vivacom/gateways/{id}/command
    if (body.action === 'command') {
      const result = {
        success: true,
        action: 'command',
        topic: body.topic ?? 'vivacom/gateways/unknown/command',
        command: body.command ?? 'noop',
        gateway: 'flespi-mqtt',
        message: `Симулирана MQTT команда "${body.command}" към ${body.topic}.`,
        timestamp: new Date().toISOString(),
      };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.protocol) {
      return new Response(JSON.stringify({ error: 'protocol required for pair/unpair' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // TODO: Свържи с реален MQTT broker (Mosquitto / Flespi MQTT)
    const result = {
      success: true,
      protocol: body.protocol,
      deviceName: body.deviceName ?? 'Unnamed device',
      action: body.action,
      gateway: 'flespi-mqtt',
      message: `Симулирано сдвояване чрез ${body.protocol}.`,
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

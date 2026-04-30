import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Power, Wifi, WifiOff, Signal, Cpu, Activity, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Gateway, GatewayStatus, InfraEvent } from '@/types/infrastructure';
import { mockGateways } from '@/data/infrastructureMockData';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const STATUS_COLORS: Record<GatewayStatus, string> = {
  online: 'bg-status-ok/15 text-status-ok border-status-ok/30',
  offline: 'bg-status-alert/15 text-status-alert border-status-alert/30',
  '5g-backup': 'bg-status-warning/15 text-status-warning border-status-warning/30',
};

const STATUS_LABEL: Record<GatewayStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  '5g-backup': '5G Backup',
};

interface GatewayMonitorProps {
  onEvent?: (event: InfraEvent) => void;
}

export function GatewayMonitor({ onEvent }: GatewayMonitorProps) {
  const [gateways, setGateways] = useState<Gateway[]>(mockGateways);
  const [rebooting, setRebooting] = useState<string | null>(null);

  // MQTT-style heartbeat simulation: jitter latency + cpu temp every 5s
  useEffect(() => {
    const id = setInterval(() => {
      setGateways((prev) =>
        prev.map((g) =>
          g.status === 'offline'
            ? g
            : {
                ...g,
                latencyMs: Math.max(8, Math.round(g.latencyMs + (Math.random() - 0.5) * 6)),
                cpuTempC: Math.max(40, Math.round(g.cpuTempC + (Math.random() - 0.5) * 2)),
                lastHeartbeat: new Date().toISOString(),
              }
        )
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const handleReboot = async (gw: Gateway) => {
    setRebooting(gw.id);
    try {
      await supabase.functions.invoke('mqtt-bridge', {
        body: {
          action: 'command',
          topic: `vivacom/gateways/${gw.id}/command`,
          command: 'reboot',
        },
      });
    } catch {
      // demo fallback — bridge may simulate
    }

    toast({
      title: 'Remote Reboot изпратен',
      description: `MQTT: vivacom/gateways/${gw.id}/command → reboot`,
    });

    onEvent?.({
      id: `ie-${Date.now()}`,
      timestamp: new Date().toISOString(),
      gatewayId: gw.id,
      gatewayName: gw.name,
      type: 'reboot-issued',
      severity: 'warning',
      message: `Ръчно изпратена команда reboot към ${gw.name}`,
      operator: 'current-user',
    });

    setTimeout(() => setRebooting(null), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Infrastructure Health (NOC)
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            MQTT Heartbeat · 5s
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {gateways.map((gw) => {
            const isOff = gw.status === 'offline';
            return (
              <div
                key={gw.id}
                className={cn(
                  'p-4 rounded-lg border bg-muted/30 space-y-3',
                  isOff && 'border-status-alert/40 bg-status-alert/5'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isOff ? (
                        <WifiOff className="w-4 h-4 text-status-alert" />
                      ) : gw.status === '5g-backup' ? (
                        <Signal className="w-4 h-4 text-status-warning" />
                      ) : (
                        <Wifi className="w-4 h-4 text-status-ok" />
                      )}
                      <p className="font-semibold truncate">{gw.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {gw.location} · FW {gw.firmware}
                    </p>
                  </div>
                  <Badge className={cn('text-xs', STATUS_COLORS[gw.status])}>
                    {STATUS_LABEL[gw.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Metric icon={Activity} label="Uptime" value={isOff ? '--' : `${gw.uptimeHours}h`} />
                  <Metric
                    icon={Signal}
                    label="Latency"
                    value={isOff ? '--' : `${gw.latencyMs} ms`}
                    tone={gw.latencyMs > 80 ? 'warn' : 'ok'}
                  />
                  <Metric
                    icon={Cpu}
                    label="CPU"
                    value={isOff ? '--' : `${gw.cpuTempC}°C`}
                    tone={gw.cpuTempC > 70 ? 'warn' : 'ok'}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    HB: {new Date(gw.lastHeartbeat).toLocaleTimeString('bg-BG', { timeZone: 'Europe/Sofia' })}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReboot(gw)}
                    disabled={rebooting === gw.id}
                  >
                    {rebooting === gw.id ? (
                      <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Power className="w-3.5 h-3.5 mr-1" />
                    )}
                    Remote Reboot
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = 'ok',
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone?: 'ok' | 'warn';
}) {
  return (
    <div className="flex flex-col gap-0.5 p-2 rounded-md bg-background/50 border border-border/50">
      <div className="flex items-center gap-1 text-muted-foreground">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <span className={cn('font-semibold', tone === 'warn' && 'text-status-warning')}>{value}</span>
    </div>
  );
}

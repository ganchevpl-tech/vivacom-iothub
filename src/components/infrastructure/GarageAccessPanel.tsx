import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Radio, Smartphone, DoorOpen, DoorClosed, ShieldAlert, Loader2 } from 'lucide-react';
import { AccessMode, ACCESS_MODE_LABELS, GarageEvent, GarageState } from '@/types/infrastructure';
import { mockGarageEvents } from '@/data/infrastructureMockData';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const STATE_LABEL: Record<GarageState, string> = {
  closed: 'Closed',
  opening: 'Opening...',
  open: 'Open',
  closing: 'Closing...',
  'security-blocked': 'Security Blocked',
};

const STATE_COLORS: Record<GarageState, string> = {
  closed: 'bg-muted text-muted-foreground border-border',
  opening: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  open: 'bg-status-ok/15 text-status-ok border-status-ok/30',
  closing: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  'security-blocked': 'bg-status-alert/15 text-status-alert border-status-alert/30',
};

const MODE_ICON: Record<AccessMode, typeof Camera> = {
  alpr: Camera,
  'uhf-rfid': Radio,
  'pwa-manual': Smartphone,
};

function isNightSofia(d: Date) {
  const hour = Number(
    new Intl.DateTimeFormat('bg-BG', { hour: '2-digit', hour12: false, timeZone: 'Europe/Sofia' }).format(d)
  );
  return hour >= 0 && hour < 5;
}

interface GarageAccessPanelProps {
  onPanic?: (event: GarageEvent) => void;
}

export function GarageAccessPanel({ onPanic }: GarageAccessPanelProps) {
  const [state, setState] = useState<GarageState>('closed');
  const [events, setEvents] = useState<GarageEvent[]>(mockGarageEvents);

  const trigger = (mode: AccessMode, plateOrTag: string, authorized = true) => {
    const night = isNightSofia(new Date());
    const ev: GarageEvent = {
      id: `ge-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode,
      plateOrTag,
      authorized,
      snapshotId: !authorized ? `snap-${Date.now()}` : undefined,
      nightWindow: night,
    };
    setEvents((prev) => [ev, ...prev].slice(0, 30));

    if (!authorized && night) {
      setState('security-blocked');
      toast({
        title: '🚨 PANIC: Unknown Tag (нощен прозорец)',
        description: `Snapshot ${ev.snapshotId} запазен. Гаражът е блокиран.`,
        variant: 'destructive',
      });
      onPanic?.(ev);
      setTimeout(() => setState('closed'), 6000);
      return;
    }

    if (!authorized) {
      setState('security-blocked');
      setTimeout(() => setState('closed'), 4000);
      return;
    }

    setState('opening');
    setTimeout(() => setState('open'), 1500);
    setTimeout(() => setState('closing'), 5000);
    setTimeout(() => setState('closed'), 6500);
  };

  // demo: simulate sporadic ALPR events
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.85 && state === 'closed') {
        trigger('alpr', 'CB ' + Math.floor(1000 + Math.random() * 8999) + ' AT');
      }
    }, 12000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const StateIcon = state === 'closed' ? DoorClosed : state === 'security-blocked' ? ShieldAlert : DoorOpen;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-primary" />
            Hybrid Garage & Door Access
          </CardTitle>
          <Badge className={cn('text-xs', STATE_COLORS[state])}>
            <StateIcon className="w-3.5 h-3.5 mr-1" />
            {STATE_LABEL[state]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => trigger('alpr', 'CB 4521 PT')} disabled={state !== 'closed'}>
            <Camera className="w-4 h-4 mr-2" /> ALPR
          </Button>
          <Button variant="outline" onClick={() => trigger('uhf-rfid', 'TAG-9821')} disabled={state !== 'closed'}>
            <Radio className="w-4 h-4 mr-2" /> UHF RFID
          </Button>
          <Button onClick={() => trigger('pwa-manual', 'manual:current-user')} disabled={state !== 'closed'}>
            <Smartphone className="w-4 h-4 mr-2" /> PWA Trigger
          </Button>
        </div>

        <div className="pt-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-status-alert hover:text-status-alert"
            onClick={() => trigger('uhf-rfid', 'TAG-UNKNOWN-' + Math.floor(Math.random() * 9999), false)}
          >
            ⚠️ Симулирай неоторизиран таг
          </Button>
        </div>

        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Последни събития</p>
          {events.map((e) => {
            const Icon = MODE_ICON[e.mode];
            return (
              <div
                key={e.id}
                className={cn(
                  'flex items-center justify-between text-xs p-2 rounded-md border',
                  e.authorized
                    ? 'border-border bg-muted/30'
                    : 'border-status-alert/40 bg-status-alert/5'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-medium truncate">{e.plateOrTag}</span>
                  <span className="text-muted-foreground hidden sm:inline">
                    · {ACCESS_MODE_LABELS[e.mode]}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {e.nightWindow && <Badge variant="outline" className="text-[10px]">night</Badge>}
                  {!e.authorized && (
                    <Badge className="text-[10px] bg-status-alert/15 text-status-alert border-status-alert/30">
                      blocked · {e.snapshotId}
                    </Badge>
                  )}
                  <span className="text-muted-foreground">
                    {new Date(e.timestamp).toLocaleTimeString('bg-BG', { timeZone: 'Europe/Sofia' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

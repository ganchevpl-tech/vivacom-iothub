import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Timer, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisitorPass {
  id: string;
  name: string;
  token: string;
  expiresAt: number;
}

const STORAGE_KEY = 'vivacom-visitor-passes';

function loadPasses(): VisitorPass[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as VisitorPass[]).filter((p) => p.expiresAt > Date.now());
  } catch {
    return [];
  }
}

function savePasses(passes: VisitorPass[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(passes));
}

function generateToken() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, expiresAt - Date.now());
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const urgent = diff < 5 * 60_000;
  if (diff <= 0) return <span className="text-status-alert font-mono">Изтекъл</span>;
  return (
    <span
      className={cn(
        'font-mono font-semibold inline-flex items-center gap-1',
        urgent ? 'text-status-alert animate-pulse' : 'text-status-ok'
      )}
    >
      <Timer className="h-3.5 w-3.5" />
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

export function VisitorQRCard() {
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState(30);

  useEffect(() => {
    setPasses(loadPasses());
    const id = setInterval(() => setPasses((curr) => curr.filter((p) => p.expiresAt > Date.now())), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    savePasses(passes);
  }, [passes]);

  const issue = () => {
    if (!name.trim()) return;
    const pass: VisitorPass = {
      id: crypto.randomUUID(),
      name: name.trim(),
      token: generateToken(),
      expiresAt: Date.now() + minutes * 60_000,
    };
    setPasses((p) => [pass, ...p]);
    setName('');
  };

  const revoke = (id: string) => setPasses((p) => p.filter((x) => x.id !== id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          Самоунищожаващи се QR пропуски
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label htmlFor="visitor-name">Име на посетител</Label>
            <Input
              id="visitor-name"
              placeholder="напр. Д-р Петров"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="duration">Минути</Label>
            <Input
              id="duration"
              type="number"
              min={5}
              max={480}
              className="w-24"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </div>
          <Button onClick={issue}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Издай QR
          </Button>
        </div>

        {passes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Няма активни пропуски
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {passes.map((p) => {
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=1a1d29&color=ffffff&data=${encodeURIComponent(
                `vivacom-pass:${p.id}:${p.token}`
              )}`;
              return (
                <div
                  key={p.id}
                  className="flex gap-3 p-3 rounded-lg border border-border bg-muted/20"
                >
                  <img
                    src={qrUrl}
                    alt={`QR for ${p.name}`}
                    className="w-24 h-24 rounded bg-card"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {p.token.slice(0, 8)}…
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Countdown expiresAt={p.expiresAt} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-status-alert"
                        onClick={() => revoke(p.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

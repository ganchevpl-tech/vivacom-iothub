import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Zap, TrendingDown, Leaf, Fuel, X, Battery } from 'lucide-react';
import type { Vehicle } from '@/types/fleet';

interface EVReadinessPanelProps {
  vehicles: Vehicle[];
  onClose?: () => void;
}

// Допускания (BG, 2026):
// Среден разход ДВГ дизел: 9 л/100км; цена дизел: 2.65 лв/л
// EV: 22 kWh/100км; цена ток (бизнес): 0.42 лв/kWh
// CO₂: 2.68 kg/литър дизел
const DIESEL_L_PER_100 = 9;
const DIESEL_PRICE = 2.65;
const EV_KWH_PER_100 = 22;
const EV_PRICE = 0.42;
const CO2_PER_L = 2.68;
const EV_RANGE_KM = 350;

interface Assessment {
  vehicle: Vehicle;
  dailyKm: number;
  monthlyKm: number;
  annualKm: number;
  rangeOk: boolean;
  fuelCostYear: number;
  evCostYear: number;
  savingsYear: number;
  co2SavedTons: number;
  score: number; // 0-100
}

function assess(v: Vehicle): Assessment {
  const dailyKm = Math.max(v.mileageToday, 80); // ако няма данни, базова стойност
  const annualKm = dailyKm * 230; // ~работни дни
  const monthlyKm = annualKm / 12;
  const rangeOk = dailyKm <= EV_RANGE_KM;

  const fuelCostYear = (annualKm / 100) * DIESEL_L_PER_100 * DIESEL_PRICE;
  const evCostYear = (annualKm / 100) * EV_KWH_PER_100 * EV_PRICE;
  const savingsYear = fuelCostYear - evCostYear;
  const co2SavedTons = ((annualKm / 100) * DIESEL_L_PER_100 * CO2_PER_L) / 1000;

  let score = 0;
  if (rangeOk) score += 50;
  if (dailyKm < 200) score += 20;
  if (annualKm > 20000) score += 20; // висока ROI
  if (v.status !== 'offline') score += 10;

  return {
    vehicle: v,
    dailyKm,
    monthlyKm,
    annualKm,
    rangeOk,
    fuelCostYear,
    evCostYear,
    savingsYear,
    co2SavedTons,
    score: Math.min(score, 100),
  };
}

export function EVReadinessPanel({ vehicles, onClose }: EVReadinessPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const assessments = useMemo(
    () => vehicles.map(assess).sort((a, b) => b.score - a.score),
    [vehicles],
  );

  const totals = useMemo(() => {
    const eligible = assessments.filter((a) => a.score >= 70);
    return {
      eligibleCount: eligible.length,
      totalSavings: eligible.reduce((s, a) => s + a.savingsYear, 0),
      totalCo2: eligible.reduce((s, a) => s + a.co2SavedTons, 0),
    };
  }, [assessments]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('bg-BG', { maximumFractionDigits: 0 }).format(n);

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed left-16 top-0 z-30 w-96 h-screen bg-card/95 backdrop-blur-sm border-r border-border shadow-lg flex flex-col"
    >
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-foreground">EV Readiness</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Анализ на маршрути за замяна с електрически
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="p-4 border-b border-border grid grid-cols-3 gap-2">
        <Card className="p-2 bg-green-500/10 border-green-500/30">
          <p className="text-[10px] text-muted-foreground uppercase">Подходящи</p>
          <p className="text-lg font-bold text-green-600">{totals.eligibleCount}</p>
        </Card>
        <Card className="p-2 bg-blue-500/10 border-blue-500/30">
          <p className="text-[10px] text-muted-foreground uppercase">Спестявания/г.</p>
          <p className="text-sm font-bold text-blue-600">{fmt(totals.totalSavings)} лв</p>
        </Card>
        <Card className="p-2 bg-emerald-500/10 border-emerald-500/30">
          <p className="text-[10px] text-muted-foreground uppercase">CO₂ спест.</p>
          <p className="text-sm font-bold text-emerald-600">{fmt(totals.totalCo2)} т</p>
        </Card>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {assessments.map((a) => {
            const isOpen = selectedId === a.vehicle.id;
            const scoreColor =
              a.score >= 70 ? 'text-green-600' : a.score >= 40 ? 'text-yellow-600' : 'text-red-600';
            const scoreBadge =
              a.score >= 70 ? 'Силно препоръчан' : a.score >= 40 ? 'Възможен' : 'Не е подходящ';

            return (
              <motion.div
                key={a.vehicle.id}
                whileHover={{ scale: 1.01 }}
                className="rounded-lg border border-border bg-muted/30 overflow-hidden"
              >
                <button
                  onClick={() => setSelectedId(isOpen ? null : a.vehicle.id)}
                  className="w-full text-left p-3 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{a.vehicle.plate}</p>
                      <p className="text-xs text-muted-foreground">{a.vehicle.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${scoreColor}`}>{a.score}</p>
                      <Badge variant="outline" className="text-[10px]">{scoreBadge}</Badge>
                    </div>
                  </div>
                  <Progress value={a.score} className="h-1.5" />
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Battery className="w-3 h-3" />
                        <span>Дн. пробег:</span>
                        <span className="font-semibold text-foreground">{fmt(a.dailyKm)} км</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        <span>EV пробег:</span>
                        <span className={a.rangeOk ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                          {a.rangeOk ? 'OK' : 'Недостатъчен'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Fuel className="w-3 h-3" />
                        <span>Год. пробег:</span>
                        <span className="font-semibold text-foreground">{fmt(a.annualKm)} км</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Leaf className="w-3 h-3 text-green-600" />
                        <span>CO₂:</span>
                        <span className="font-semibold text-foreground">{a.co2SavedTons.toFixed(1)} т/г</span>
                      </div>
                    </div>

                    <div className="rounded-md bg-background p-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Дизел/година:</span>
                        <span className="font-mono text-red-600">{fmt(a.fuelCostYear)} лв</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Електр./година:</span>
                        <span className="font-mono text-green-600">{fmt(a.evCostYear)} лв</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-1 mt-1">
                        <span className="font-semibold flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-green-600" />
                          Спестяване:
                        </span>
                        <span className="font-bold text-green-600">{fmt(a.savingsYear)} лв</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border text-[10px] text-muted-foreground bg-muted/30">
        Базирано на: дизел {DIESEL_L_PER_100} л/100км @ {DIESEL_PRICE} лв/л, EV {EV_KWH_PER_100} kWh/100км @ {EV_PRICE} лв/kWh, обхват {EV_RANGE_KM} км.
      </div>
    </motion.div>
  );
}

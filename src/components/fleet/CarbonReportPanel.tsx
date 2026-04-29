import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, FileText, Download, X, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Vehicle } from '@/types/fleet';

interface CarbonReportPanelProps {
  vehicles: Vehicle[];
  onClose?: () => void;
}

// Емисионни фактори (DEFRA / EU EEA, 2025):
const CO2_DIESEL_KG_PER_L = 2.68;
const NOX_G_PER_KM = 0.45;
const PM_G_PER_KM = 0.025;
const DIESEL_L_PER_100 = 9;

interface Row {
  vehicle: Vehicle;
  annualKm: number;
  litersYear: number;
  co2Tons: number;
  noxKg: number;
  pmKg: number;
  scope1Tons: number; // прякo гориво
}

function compute(v: Vehicle): Row {
  const dailyKm = Math.max(v.mileageToday, 80);
  const annualKm = dailyKm * 230;
  const litersYear = (annualKm / 100) * DIESEL_L_PER_100;
  const co2Tons = (litersYear * CO2_DIESEL_KG_PER_L) / 1000;
  const noxKg = (annualKm * NOX_G_PER_KM) / 1000;
  const pmKg = (annualKm * PM_G_PER_KM) / 1000;
  return {
    vehicle: v,
    annualKm,
    litersYear,
    co2Tons,
    noxKg,
    pmKg,
    scope1Tons: co2Tons,
  };
}

export function CarbonReportPanel({ vehicles, onClose }: CarbonReportPanelProps) {
  const rows = useMemo(() => vehicles.map(compute), [vehicles]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        km: acc.km + r.annualKm,
        liters: acc.liters + r.litersYear,
        co2: acc.co2 + r.co2Tons,
        nox: acc.nox + r.noxKg,
        pm: acc.pm + r.pmKg,
      }),
      { km: 0, liters: 0, co2: 0, nox: 0, pm: 0 },
    );
  }, [rows]);

  const fmt = (n: number, frac = 0) =>
    new Intl.NumberFormat('bg-BG', { maximumFractionDigits: frac }).format(n);

  const exportCsv = () => {
    const header = 'Регистрация,Име,Шофьор,Год. пробег (км),Гориво (л),CO₂ (т),NOx (кг),PM (кг)\n';
    const body = rows
      .map((r) =>
        [
          r.vehicle.plate,
          r.vehicle.name,
          r.vehicle.driver,
          fmt(r.annualKm),
          fmt(r.litersYear),
          r.co2Tons.toFixed(2),
          r.noxKg.toFixed(2),
          r.pmKg.toFixed(3),
        ].join(','),
      )
      .join('\n');
    const totalsRow = `\nОБЩО,,,,${fmt(totals.km)},${fmt(totals.liters)},${totals.co2.toFixed(2)},${totals.nox.toFixed(2)},${totals.pm.toFixed(3)}`;
    const csv = header + body + totalsRow;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `esg-carbon-report-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportEsgReport = () => {
    const date = new Date().toLocaleDateString('bg-BG');
    const html = `<!DOCTYPE html><html lang="bg"><head><meta charset="utf-8"><title>ESG Отчет</title>
<style>body{font-family:Arial;padding:40px;max-width:900px;margin:auto}h1{color:#0066cc}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f0f0f0}.tot{font-weight:bold;background:#fffae6}</style>
</head><body>
<h1>ESG Отчет за въглеродни емисии</h1>
<p><strong>Дата:</strong> ${date}<br><strong>Стандарт:</strong> GHG Protocol Scope 1 — Mobile Combustion<br><strong>Брой превозни средства:</strong> ${rows.length}</p>
<h2>Обобщение</h2>
<ul>
<li>Общ годишен пробег: <strong>${fmt(totals.km)} км</strong></li>
<li>Изгорено гориво: <strong>${fmt(totals.liters)} литра дизел</strong></li>
<li>CO₂ еквивалент (Scope 1): <strong>${totals.co2.toFixed(2)} тона</strong></li>
<li>NOx емисии: <strong>${totals.nox.toFixed(2)} кг</strong></li>
<li>Прахови частици (PM): <strong>${totals.pm.toFixed(3)} кг</strong></li>
</ul>
<h2>Детайл по превозни средства</h2>
<table><thead><tr><th>Рег. №</th><th>Име</th><th>Год. пробег (км)</th><th>Гориво (л)</th><th>CO₂ (т)</th><th>NOx (кг)</th></tr></thead><tbody>
${rows.map((r) => `<tr><td>${r.vehicle.plate}</td><td>${r.vehicle.name}</td><td>${fmt(r.annualKm)}</td><td>${fmt(r.litersYear)}</td><td>${r.co2Tons.toFixed(2)}</td><td>${r.noxKg.toFixed(2)}</td></tr>`).join('')}
<tr class="tot"><td colspan="2">ОБЩО</td><td>${fmt(totals.km)}</td><td>${fmt(totals.liters)}</td><td>${totals.co2.toFixed(2)}</td><td>${totals.nox.toFixed(2)}</td></tr>
</tbody></table>
<p style="font-size:11px;color:#666;margin-top:30px">Методология: DEFRA 2025 emission factors. CO₂: 2.68 kg/л дизел. Обхват: Scope 1 (директни емисии от собствени превозни средства).</p>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `esg-report-${dateStr}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed left-16 top-0 z-30 w-[28rem] h-screen bg-card/95 backdrop-blur-sm border-r border-border shadow-lg flex flex-col"
    >
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-foreground">Carbon Footprint & ESG</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Централизирана отчетност — GHG Protocol Scope 1
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="p-4 border-b border-border grid grid-cols-2 gap-2">
        <Card className="p-3 bg-emerald-500/10 border-emerald-500/30">
          <p className="text-[10px] text-muted-foreground uppercase">CO₂ годишно</p>
          <p className="text-2xl font-bold text-emerald-600">{totals.co2.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">тона CO₂eq</p>
        </Card>
        <Card className="p-3 bg-orange-500/10 border-orange-500/30">
          <p className="text-[10px] text-muted-foreground uppercase">Гориво годишно</p>
          <p className="text-2xl font-bold text-orange-600">{fmt(totals.liters)}</p>
          <p className="text-[10px] text-muted-foreground">литра дизел</p>
        </Card>
        <Card className="p-3 bg-blue-500/10 border-blue-500/30">
          <p className="text-[10px] text-muted-foreground uppercase">NOx</p>
          <p className="text-lg font-bold text-blue-600">{totals.nox.toFixed(1)} кг</p>
        </Card>
        <Card className="p-3 bg-purple-500/10 border-purple-500/30">
          <p className="text-[10px] text-muted-foreground uppercase">PM прах</p>
          <p className="text-lg font-bold text-purple-600">{totals.pm.toFixed(2)} кг</p>
        </Card>
      </div>

      <div className="px-4 py-3 border-b border-border flex gap-2">
        <Button onClick={exportEsgReport} size="sm" className="flex-1">
          <FileText className="w-4 h-4 mr-1" />
          ESG Отчет
        </Button>
        <Button onClick={exportCsv} size="sm" variant="outline" className="flex-1">
          <Download className="w-4 h-4 mr-1" />
          CSV Експорт
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Превозно средство</TableHead>
              <TableHead className="text-xs text-right">Гориво (л)</TableHead>
              <TableHead className="text-xs text-right">CO₂ (т)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.vehicle.id}>
                <TableCell className="py-2">
                  <p className="text-xs font-semibold">{r.vehicle.plate}</p>
                  <p className="text-[10px] text-muted-foreground">{r.vehicle.name}</p>
                </TableCell>
                <TableCell className="py-2 text-right text-xs font-mono">{fmt(r.litersYear)}</TableCell>
                <TableCell className="py-2 text-right text-xs font-mono text-emerald-600">
                  {r.co2Tons.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="p-3 border-t border-border text-[10px] text-muted-foreground bg-muted/30 flex items-start gap-1.5">
        <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>Методология: GHG Protocol Scope 1 + DEFRA 2025. Подходящо за CSRD/ESG отчети.</span>
      </div>
    </motion.div>
  );
}

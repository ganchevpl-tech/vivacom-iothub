import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { InfraEvent, INFRA_EVENT_LABELS } from '@/types/infrastructure';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SEVERITY_COLORS: Record<InfraEvent['severity'], string> = {
  info: 'bg-primary/15 text-primary border-primary/30',
  warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  critical: 'bg-status-alert/15 text-status-alert border-status-alert/30',
};

const SEVERITY_ICON = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

interface InfrastructureLogProps {
  events: InfraEvent[];
}

export function InfrastructureLog({ events }: InfrastructureLogProps) {
  const exportCsv = () => {
    const header = 'timestamp;gateway;type;severity;operator;message\n';
    const rows = events
      .map((e) =>
        [
          new Date(e.timestamp).toLocaleString('bg-BG', { timeZone: 'Europe/Sofia' }),
          e.gatewayName,
          INFRA_EVENT_LABELS[e.type],
          e.severity,
          e.operator ?? '',
          e.message.replace(/;/g, ','),
        ].join(';')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infrastructure-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Експортиран отчет', description: 'CSV за Building Manager е генериран.' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Managed Service Log
          </CardTitle>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Време</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Събитие</TableHead>
                <TableHead>Сериозност</TableHead>
                <TableHead>Описание</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    Няма регистрирани събития
                  </TableCell>
                </TableRow>
              )}
              {events.map((e) => {
                const Icon = SEVERITY_ICON[e.severity];
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleString('bg-BG', { timeZone: 'Europe/Sofia' })}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{e.gatewayName}</TableCell>
                    <TableCell className="text-xs">{INFRA_EVENT_LABELS[e.type]}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px]', SEVERITY_COLORS[e.severity])}>
                        <Icon className="w-3 h-3 mr-1" />
                        {e.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.message}
                      {e.operator && <span className="ml-1 italic">· {e.operator}</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PanicAlertBanner } from '@/components/safety/PanicAlertBanner';
import { NightWanderingLog } from '@/components/safety/NightWanderingLog';
import { SafeZoneMonitor } from '@/components/safety/SafeZoneMonitor';
import { VisitorTracker } from '@/components/safety/VisitorTracker';
import { VisitorQRCard } from '@/components/safety/VisitorQRCard';
import { mockSafetyAlerts, mockSafeZones, mockVisitors } from '@/data/safetyMockData';
import { useNightWandering } from '@/hooks/useNightWandering';
import { Card, CardContent } from '@/components/ui/card';
import { Moon, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const SecurityAlerts = () => {
  const [alerts, setAlerts] = useState(mockSafetyAlerts);
  const { events, isNightWindow, activeCount } = useNightWandering();

  const acknowledge = (id: string) =>
    setAlerts((a) => a.map((al) => (al.id === id ? { ...al, acknowledged: true } : al)));

  return (
    <DashboardLayout
      title="Security Alerts"
      subtitle="Паник аларми, нощни патрули и геофенсинг"
    >
      <div className="space-y-6">
        <PanicAlertBanner alerts={alerts} onAcknowledge={acknowledge} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-status-alert" />
              <div>
                <p className="text-2xl font-bold">{alerts.filter((a) => !a.acknowledged).length}</p>
                <p className="text-xs text-muted-foreground">Активни паник аларми</p>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(isNightWindow && 'border-purple-500/50 bg-purple-500/5')}>
            <CardContent className="p-4 flex items-center gap-3">
              <Moon className={cn('w-8 h-8', isNightWindow ? 'text-purple-400 animate-pulse' : 'text-muted-foreground')} />
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">
                  Night wandering {isNightWindow ? '(активен прозорец 00:00-05:00)' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-status-warning" />
              <div>
                <p className="text-2xl font-bold">{mockSafeZones.length}</p>
                <p className="text-xs text-muted-foreground">Safe Zones</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-status-ok" />
              <div>
                <p className="text-2xl font-bold">{mockVisitors.filter((v) => v.isActive).length}</p>
                <p className="text-xs text-muted-foreground">Активни визитори</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SafeZoneMonitor zones={mockSafeZones} />
          <NightWanderingLog events={events} />
        </div>

        <VisitorQRCard />
        <VisitorTracker visitors={mockVisitors} />
      </div>
    </DashboardLayout>
  );
};

export default SecurityAlerts;

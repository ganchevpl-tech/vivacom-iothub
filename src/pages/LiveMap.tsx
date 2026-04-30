import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FloorPlan } from '@/components/dashboard/FloorPlan';
import { AccessPointsMap } from '@/components/dashboard/AccessPointsMap';
import { LiveIndicator } from '@/components/dashboard/LiveIndicator';
import { ProtocolBadge } from '@/components/devices/ProtocolBadge';
import { AddDeviceModal } from '@/components/devices/AddDeviceModal';
import { useFlespiData } from '@/hooks/useFlespiData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LiveMap = () => {
  const { sensors, isConnected, lastUpdated, error } = useFlespiData();

  return (
    <DashboardLayout
      title="Live Map"
      subtitle="Реално-времево наблюдение на сграда и протоколи"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <LiveIndicator isConnected={isConnected} />
            <ProtocolBadge protocol="matter" />
            <ProtocolBadge protocol="zigbee" />
            <ProtocolBadge protocol="z-wave" />
            <ProtocolBadge protocol="mqtt" />
            <span className="text-xs text-muted-foreground">
              {lastUpdated
                ? `Последно: ${lastUpdated.toLocaleTimeString('bg-BG', { timeZone: 'Europe/Sofia' })}`
                : 'Свързване...'}
            </span>
          </div>
          <AddDeviceModal />
        </div>

        {error && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="ml-2">
              Грешка във връзката: {error}. Показват се кеширани данни.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>План на сградата</CardTitle>
            </CardHeader>
            <CardContent>
              <FloorPlan sensors={sensors} isConnected={isConnected} />
            </CardContent>
          </Card>
          <AccessPointsMap />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LiveMap;

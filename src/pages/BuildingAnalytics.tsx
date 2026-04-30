import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SensorGrid } from '@/components/dashboard/SensorGrid';
import { useFlespiData } from '@/hooks/useFlespiData';
import { Cpu, Activity, ThermometerSun, Droplets } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ProtocolBadge } from '@/components/devices/ProtocolBadge';
import { AddDeviceModal } from '@/components/devices/AddDeviceModal';
import { GatewayMonitor } from '@/components/infrastructure/GatewayMonitor';
import { InfrastructureLog } from '@/components/infrastructure/InfrastructureLog';
import { GarageAccessPanel } from '@/components/infrastructure/GarageAccessPanel';
import { mockInfraEvents } from '@/data/infrastructureMockData';
import { InfraEvent } from '@/types/infrastructure';

const BuildingAnalytics = () => {
  const { sensors, isConnected } = useFlespiData();
  const [events, setEvents] = useState<InfraEvent[]>(mockInfraEvents);

  const tempSensors = sensors.filter((s) => s.type === 'temperature');
  const humSensors = sensors.filter((s) => s.type === 'humidity');
  const avgTemp = tempSensors.length
    ? (tempSensors.reduce((a, s) => a + Number(s.value), 0) / tempSensors.length).toFixed(1)
    : '--';
  const avgHum = humSensors.length
    ? (humSensors.reduce((a, s) => a + Number(s.value), 0) / humSensors.length).toFixed(1)
    : '--';
  const alertCount = sensors.filter((s) => s.status === 'alert').length;

  const addEvent = (e: InfraEvent) => setEvents((prev) => [e, ...prev]);

  return (
    <DashboardLayout
      title="Building Analytics"
      subtitle="Енергия, климат, NOC и протоколна свързаност"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Активни сензори" value={sensors.length} subtitle="Live от Flespi" icon={Cpu} variant="primary" delay={0} />
          <StatCard title="Средна температура" value={`${avgTemp} °C`} subtitle="Всички зони" icon={ThermometerSun} delay={0.1} />
          <StatCard title="Средна влажност" value={`${avgHum} %`} subtitle="Всички зони" icon={Droplets} variant="secondary" delay={0.2} />
          <StatCard title="Сензорни аларми" value={alertCount} subtitle="Извън нормата" icon={Activity} variant={alertCount > 0 ? 'alert' : 'default'} delay={0.3} />
        </div>

        <GatewayMonitor onEvent={addEvent} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GarageAccessPanel
            onPanic={(g) =>
              addEvent({
                id: `ie-${g.id}`,
                timestamp: g.timestamp,
                gatewayId: 'gw-garage',
                gatewayName: 'Garage Controller',
                type: 'manual-override',
                severity: 'critical',
                message: `Unknown tag ${g.plateOrTag} (snapshot ${g.snapshotId}) — нощен прозорец`,
              })
            }
          />
          <InfrastructureLog events={events} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Протоколна разпределеност</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <ProtocolBadge protocol="mqtt" />
                <ProtocolBadge protocol="matter" />
                <ProtocolBadge protocol="zigbee" />
                <ProtocolBadge protocol="z-wave" />
                <ProtocolBadge protocol="wifi" />
                <AddDeviceModal />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SensorGrid sensors={sensors} isConnected={isConnected} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BuildingAnalytics;

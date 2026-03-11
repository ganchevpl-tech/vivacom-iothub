import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SensorGrid } from '@/components/dashboard/SensorGrid';
import { AccessControlList } from '@/components/dashboard/AccessControlList';
import { FloorPlan } from '@/components/dashboard/FloorPlan';
import { LogManager } from '@/components/dashboard/LogManager';
import { GoogleMapsView } from '@/components/dashboard/GoogleMapsView';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { SortableWidget } from '@/components/dashboard/SortableWidget';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { mockStats, mockSensorReadings, mockAccessEntries, mockLogEntries } from '@/data/mockData';
import { useFlespiData } from '@/hooks/useFlespiData';
import { Cpu, AlertTriangle, Users, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const { currentOrganizationId } = useAuth();
  const { sensors: liveSensors, isConnected, lastUpdated, error } = useFlespiData();
  const { widgetOrder, isEditing, isSaving, setIsEditing, setWidgetOrder, saveOrder, resetLayout } = useDashboardLayout();

  const activeAlerts = liveSensors.length > 0 ? liveSensors.filter(s => s.status === 'alert').length : mockStats.activeAlerts;
  const personnelOnSite = mockStats.personnelOnSite;

  const sensors = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const keyboard = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
  const dndSensors = useSensors(sensors, keyboard);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgetOrder.indexOf(active.id as string);
      const newIndex = widgetOrder.indexOf(over.id as string);
      const newOrder = arrayMove(widgetOrder, oldIndex, newIndex);
      setWidgetOrder(newOrder);
      saveOrder(newOrder);
    }
  };

  const widgetContent: Record<string, React.ReactNode> = {
    stats: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Devices" value={mockStats.totalDevices} subtitle={`${mockStats.devicesOnline} online • ${mockStats.devicesOffline} offline`} icon={Cpu} variant="primary" delay={0} />
        <StatCard title="Active Alerts" value={activeAlerts ?? mockStats.activeAlerts} subtitle="Requires attention" icon={AlertTriangle} variant={(activeAlerts ?? mockStats.activeAlerts) > 0 ? 'alert' : 'default'} delay={0.1} />
        <StatCard title="Personnel On-site" value={personnelOnSite ?? mockStats.personnelOnSite} subtitle="Currently checked in" icon={Users} variant="secondary" delay={0.2} />
        <StatCard title="Network Status" value="99.9%" subtitle="Uptime last 24h" icon={Wifi} trend={{ value: 0.2, isPositive: true }} delay={0.3} />
      </div>
    ),
    sensors: (
      <FeatureGate feature="basic_sensors" organizationId={currentOrganizationId ?? undefined}>
        <div className="bg-card rounded-xl shadow-card border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Live Sensor Grid</h2>
              <p className="text-sm text-muted-foreground">Real-time sensor readings</p>
            </div>
            <div className="flex items-center gap-4">
              <LiveIndicator isConnected={isConnected} />
              <div className="text-xs text-muted-foreground">
                {lastUpdated
                  ? `Updated: ${lastUpdated.toLocaleTimeString('bg-BG', { timeZone: 'Europe/Sofia' })}`
                  : 'Connecting...'}
              </div>
            </div>
          </div>
          <SensorGrid sensors={liveSensors.length > 0 ? liveSensors : mockSensorReadings} isConnected={isConnected} />
        </div>
      </FeatureGate>
    ),
    access: (
      <AccessControlList entries={mockAccessEntries} />
    ),
    floorplan: (
      <FloorPlan sensors={liveSensors.length > 0 ? liveSensors : mockSensorReadings} isConnected={isConnected} />
    ),
    google_maps: (
      <FeatureGate feature="google_maps" organizationId={currentOrganizationId ?? undefined}>
        <GoogleMapsView />
      </FeatureGate>
    ),
    logs: (
      <FeatureGate feature="log_viewer" organizationId={currentOrganizationId ?? undefined}>
        <LogManager logs={mockLogEntries} />
      </FeatureGate>
    ),
  };

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Real-time IoT monitoring and control"
    >
      <div className="space-y-6">
        <DashboardToolbar
          isEditing={isEditing}
          isSaving={isSaving}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onReset={resetLayout}
        />

        {error && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="ml-2">
              Connection error: {error}. Showing cached/mock data.
            </AlertDescription>
          </Alert>
        )}

        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {widgetOrder.map((id) => (
                <SortableWidget key={id} id={id} isEditing={isEditing}>
                  {widgetContent[id]}
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </DashboardLayout>
  );
};

export default Index;

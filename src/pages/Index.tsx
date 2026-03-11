import { useMemo } from 'react';
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const { Responsive, WidthProvider } = ReactGridLayout as any;
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SensorGrid } from '@/components/dashboard/SensorGrid';
import { AccessControlList } from '@/components/dashboard/AccessControlList';
import { FloorPlan } from '@/components/dashboard/FloorPlan';
import { LogManager } from '@/components/dashboard/LogManager';
import { LiveIndicator } from '@/components/dashboard/LiveIndicator';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboardLayout, WIDGET_LABELS } from '@/hooks/useDashboardLayout';
import { mockStats, mockSensorReadings, mockAccessEntries, mockLogEntries } from '@/data/mockData';
import { useFlespiData } from '@/hooks/useFlespiData';
import { Cpu, AlertTriangle, Users, Wifi, WifiOff, GripVertical } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const ResponsiveGridLayout = WidthProvider(Responsive);

const Index = () => {
  const { currentOrganizationId } = useAuth();
  const { sensors: liveSensors, isConnected, lastUpdated, error } = useFlespiData();
  const { layout, isEditing, isSaving, setIsEditing, onLayoutChange, resetLayout } = useDashboardLayout();

  const activeAlerts = liveSensors.length > 0 ? liveSensors.filter(s => s.status === 'alert').length : mockStats.activeAlerts;
  const personnelOnSite = mockStats.personnelOnSite;

  const layouts = useMemo(() => ({ lg: layout, md: layout, sm: layout }), [layout]);

  const widgetContent: Record<string, React.ReactNode> = {
    stats: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
        <StatCard title="Total Devices" value={mockStats.totalDevices} subtitle={`${mockStats.devicesOnline} online • ${mockStats.devicesOffline} offline`} icon={Cpu} variant="primary" delay={0} />
        <StatCard title="Active Alerts" value={activeAlerts ?? mockStats.activeAlerts} subtitle="Requires attention" icon={AlertTriangle} variant={(activeAlerts ?? mockStats.activeAlerts) > 0 ? 'alert' : 'default'} delay={0.1} />
        <StatCard title="Personnel On-site" value={personnelOnSite ?? mockStats.personnelOnSite} subtitle="Currently checked in" icon={Users} variant="secondary" delay={0.2} />
        <StatCard title="Network Status" value="99.9%" subtitle="Uptime last 24h" icon={Wifi} trend={{ value: 0.2, isPositive: true }} delay={0.3} />
      </div>
    ),
    sensors: (
      <FeatureGate feature="basic_sensors" organizationId={currentOrganizationId ?? undefined}>
        <div className="bg-card rounded-xl shadow-card border border-border p-6 h-full overflow-auto">
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
      <div className="h-full overflow-auto">
        <AccessControlList entries={mockAccessEntries} />
      </div>
    ),
    floorplan: (
      <div className="h-full overflow-auto">
        <FloorPlan sensors={liveSensors.length > 0 ? liveSensors : mockSensorReadings} isConnected={isConnected} />
      </div>
    ),
    logs: (
      <FeatureGate feature="log_viewer" organizationId={currentOrganizationId ?? undefined}>
        <div className="h-full overflow-auto">
          <LogManager logs={mockLogEntries} />
        </div>
      </FeatureGate>
    ),
  };

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Real-time IoT monitoring and control"
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <DashboardToolbar
            isEditing={isEditing}
            isSaving={isSaving}
            onToggleEdit={() => setIsEditing(!isEditing)}
            onReset={resetLayout}
          />
        </div>

        {/* Connection Error Banner */}
        {error && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="ml-2">
              Connection error: {error}. Showing cached/mock data.
            </AlertDescription>
          </Alert>
        )}

        {/* Grid Layout */}
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 0 }}
          cols={{ lg: 12, md: 12, sm: 12 }}
          rowHeight={30}
          isDraggable={isEditing}
          isResizable={isEditing}
          onLayoutChange={(currentLayout) => {
            if (isEditing) {
              onLayoutChange(currentLayout);
            }
          }}
          draggableHandle=".widget-drag-handle"
          compactType="vertical"
          margin={[16, 16]}
        >
          {layout.map((item) => (
            <div
              key={item.i}
              className={cn(
                'relative group',
                isEditing && 'ring-2 ring-primary/20 ring-dashed rounded-xl'
              )}
            >
              {/* Drag handle */}
              {isEditing && (
                <div className="widget-drag-handle absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-xs font-medium cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3" />
                  {WIDGET_LABELS[item.i] || item.i}
                </div>
              )}
              {widgetContent[item.i]}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </DashboardLayout>
  );
};

export default Index;

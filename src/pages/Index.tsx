import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { SensorGrid } from '@/components/dashboard/SensorGrid';
import { AccessControlList } from '@/components/dashboard/AccessControlList';
import { LogManager } from '@/components/dashboard/LogManager';
import { LiveIndicator } from '@/components/dashboard/LiveIndicator';
import { mockStats, mockSensorReadings, mockAccessEntries, mockLogEntries } from '@/data/mockData';
import { useFlespiData } from '@/hooks/useFlespiData';
import { Cpu, AlertTriangle, Users, Wifi } from 'lucide-react';

const Index = () => {
  const { sensors: liveSensors, isConnected, lastUpdated } = useFlespiData();

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Real-time IoT monitoring and control"
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Devices"
            value={mockStats.totalDevices}
            subtitle={`${mockStats.devicesOnline} online • ${mockStats.devicesOffline} offline`}
            icon={Cpu}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Active Alerts"
            value={mockStats.activeAlerts}
            subtitle="Requires attention"
            icon={AlertTriangle}
            variant={mockStats.activeAlerts > 0 ? 'alert' : 'default'}
            delay={0.1}
          />
          <StatCard
            title="Personnel On-site"
            value={mockStats.personnelOnSite}
            subtitle="Currently checked in"
            icon={Users}
            variant="secondary"
            delay={0.2}
          />
          <StatCard
            title="Network Status"
            value="99.9%"
            subtitle="Uptime last 24h"
            icon={Wifi}
            trend={{ value: 0.2, isPositive: true }}
            delay={0.3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Sensor Grid - Takes 2 columns */}
          <div className="xl:col-span-2">
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
                      ? `Updated: ${lastUpdated.toLocaleTimeString()}`
                      : 'Connecting...'
                    }
                  </div>
                </div>
              </div>
              <SensorGrid 
                sensors={mockSensorReadings} 
                liveSensors={liveSensors}
                isConnected={isConnected}
              />
            </div>
          </div>

          {/* Access Control - Takes 1 column */}
          <div className="xl:col-span-1">
            <AccessControlList entries={mockAccessEntries} />
          </div>
        </div>

        {/* Log Manager */}
        <LogManager logs={mockLogEntries} />
      </div>
    </DashboardLayout>
  );
};

export default Index;

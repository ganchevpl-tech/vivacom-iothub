import { useState, useCallback } from 'react';
import { LeftIconBar } from '@/components/fleet/LeftIconBar';
import { UnitsPanel } from '@/components/fleet/UnitsPanel';
import { VehicleDetailPanel } from '@/components/fleet/VehicleDetailPanel';
import { FleetMap } from '@/components/fleet/FleetMap';
import { EVReadinessPanel } from '@/components/fleet/EVReadinessPanel';
import { CarbonReportPanel } from '@/components/fleet/CarbonReportPanel';
import { mockVehicles, mockFleetStats } from '@/data/fleetMockData';
import { useFleetData } from '@/hooks/useFleetData';
import type { LeftPanelTab, FleetStats } from '@/types/fleet';
import 'leaflet/dist/leaflet.css';

const Fleet = () => {
  const { currentOrganizationId } = useAuth();
  const [activeTab, setActiveTab] = useState<LeftPanelTab>('units');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>();

  const { vehicles: liveVehicles, isLoading, error, lastUpdate } = useFleetData();

  // Use live data if available, otherwise mock for demo
  const vehicles = liveVehicles.length > 0 ? liveVehicles : mockVehicles;
  const stats: FleetStats = liveVehicles.length > 0
    ? {
        totalVehicles: vehicles.length,
        onlineNow: vehicles.filter((v) => v.status !== 'offline').length,
        inMotion: vehicles.filter((v) => v.status === 'moving').length,
        activeAlerts: 0,
      }
    : mockFleetStats;

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  }, []);

  return (
    <FeatureGate feature="fleet_management" organizationId={currentOrganizationId ?? undefined}>
      <div className="w-screen h-screen bg-background overflow-hidden">
        <FleetMap
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onVehicleSelect={handleVehicleSelect}
        />

        <LeftIconBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          alertCount={stats.activeAlerts}
        />

        <div className="absolute top-4 right-4 z-[1000] px-3 py-1.5 rounded-md bg-card/95 backdrop-blur border text-xs space-y-0.5 shadow-lg">
          {isLoading && <div className="text-muted-foreground">Зареждане…</div>}
          {!isLoading && liveVehicles.length > 0 && (
            <div className="text-green-600 font-medium">● На живо ({liveVehicles.length})</div>
          )}
          {!isLoading && liveVehicles.length === 0 && (
            <div className="text-amber-600 font-medium">⚠ Демо данни</div>
          )}
          {error && <div className="text-destructive max-w-[200px] truncate">{error}</div>}
          {lastUpdate && (
            <div className="text-muted-foreground">
              {lastUpdate.toLocaleTimeString('bg-BG')}
            </div>
          )}
        </div>

        {activeTab === 'units' && (
          <UnitsPanel
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleSelect={handleVehicleSelect}
            stats={stats}
          />
        )}

        {selectedVehicle && activeTab === 'units' && (
          <VehicleDetailPanel
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicleId(undefined)}
          />
        )}

        {activeTab === 'ev-readiness' && (
          <EVReadinessPanel vehicles={vehicles} onClose={() => setActiveTab('units')} />
        )}

        {activeTab === 'carbon' && (
          <CarbonReportPanel vehicles={vehicles} onClose={() => setActiveTab('units')} />
        )}
      </div>
    </FeatureGate>
  );
};

export default Fleet;

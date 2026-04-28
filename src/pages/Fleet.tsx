import { useState, useCallback } from 'react';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuth } from '@/providers/AuthProvider';
import { LeftIconBar } from '@/components/fleet/LeftIconBar';
import { UnitsPanel } from '@/components/fleet/UnitsPanel';
import { VehicleDetailPanel } from '@/components/fleet/VehicleDetailPanel';
import { FleetMap } from '@/components/fleet/FleetMap';
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

  const selectedVehicle = mockVehicles.find((v) => v.id === selectedVehicleId);

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  }, []);

  return (
    <FeatureGate feature="fleet_management" organizationId={currentOrganizationId ?? undefined}>
      <div className="w-screen h-screen bg-background overflow-hidden">
        {/* Map Container */}
        <FleetMap
          vehicles={mockVehicles}
          selectedVehicleId={selectedVehicleId}
          onVehicleSelect={handleVehicleSelect}
        />

        {/* Left Icon Bar */}
        <LeftIconBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          alertCount={mockFleetStats.activeAlerts}
        />

        {/* Left Panel - Units */}
        {activeTab === 'units' && (
          <UnitsPanel
            vehicles={mockVehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleSelect={handleVehicleSelect}
            stats={mockFleetStats}
          />
        )}

        {/* Right Panel - Vehicle Details */}
        {selectedVehicle && activeTab === 'units' && (
          <VehicleDetailPanel
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicleId(undefined)}
          />
        )}
      </div>
    </FeatureGate>
  );
};

export default Fleet;

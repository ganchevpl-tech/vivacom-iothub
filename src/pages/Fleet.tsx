import { useState, useCallback } from 'react';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuth } from '@/providers/AuthProvider';
import { LeftIconBar } from '@/components/fleet/LeftIconBar';
import { UnitsPanel } from '@/components/fleet/UnitsPanel';
import { VehicleDetailPanel } from '@/components/fleet/VehicleDetailPanel';
import { FleetMap } from '@/components/fleet/FleetMap';
import { mockVehicles, mockFleetStats } from '@/data/fleetMockData';
import type { LeftPanelTab } from '@/types/fleet';
import 'leaflet/dist/leaflet.css';

const Fleet = () => {
  const { currentOrganizationId } = useAuth();
  const [activeTab, setActiveTab] = useState<LeftPanelTab>('units');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>();

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

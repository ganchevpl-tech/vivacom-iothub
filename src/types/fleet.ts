export type VehicleStatus = 'moving' | 'idle' | 'parked-short' | 'parked-long' | 'offline';

export interface Vehicle {
  id: string;
  plate: string;
  name: string;
  make: string;
  model: string;
  driver: string;
  status: VehicleStatus;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  battery: number;
  signal: number;
  fuel: number;
  address: string;
  mileageToday: number;
  mileageTotal: number;
  statusDuration: number;
  lastUpdate: Date;
}

export interface FleetStats {
  totalVehicles: number;
  onlineNow: number;
  inMotion: number;
  activeAlerts: number;
}

export type LeftPanelTab = 'units' | 'drivers' | 'tracks' | 'alerts' | 'geofences' | 'reports' | 'maintenance' | 'fuel' | 'routes' | 'ev-readiness' | 'carbon' | 'settings';

// Multi-protocol device types for Smart Building / Healthcare ecosystem
export type DeviceProtocol = 'matter' | 'zigbee' | 'z-wave' | 'mqtt' | 'wifi';

export const PROTOCOL_LABELS: Record<DeviceProtocol, string> = {
  matter: 'Matter (IP)',
  zigbee: 'Zigbee 3.0',
  'z-wave': 'Z-Wave',
  mqtt: 'MQTT',
  wifi: 'Wi-Fi',
};

export const PROTOCOL_COLORS: Record<DeviceProtocol, string> = {
  matter: 'bg-primary/15 text-primary border-primary/30',
  zigbee: 'bg-secondary/15 text-secondary border-secondary/30',
  'z-wave': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  mqtt: 'bg-status-ok/15 text-status-ok border-status-ok/30',
  wifi: 'bg-status-warning/15 text-status-warning border-status-warning/30',
};

export interface DiscoveredDevice {
  id: string;
  name: string;
  protocol: DeviceProtocol;
  vendor: string;
  rssi?: number;
  pairingCode?: string;
}

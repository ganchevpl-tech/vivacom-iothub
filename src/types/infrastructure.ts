// Infrastructure / NOC types for managed gateways and door access

export type GatewayStatus = 'online' | 'offline' | '5g-backup';

export interface Gateway {
  id: string;
  name: string;
  location: string;
  status: GatewayStatus;
  uptimeHours: number;
  latencyMs: number;
  cpuTempC: number;
  lastHeartbeat: string;
  firmware: string;
}

export type InfraEventType =
  | 'gateway-disconnect'
  | 'gateway-reconnect'
  | 'power-failure'
  | 'manual-override'
  | 'reboot-issued'
  | '5g-failover';

export interface InfraEvent {
  id: string;
  timestamp: string;
  gatewayId: string;
  gatewayName: string;
  type: InfraEventType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  operator?: string;
}

export const INFRA_EVENT_LABELS: Record<InfraEventType, string> = {
  'gateway-disconnect': 'Gateway disconnect',
  'gateway-reconnect': 'Gateway reconnect',
  'power-failure': 'Power failure',
  'manual-override': 'Manual override',
  'reboot-issued': 'Remote reboot',
  '5g-failover': '5G failover',
};

// Hybrid Garage / Door Access
export type AccessMode = 'alpr' | 'uhf-rfid' | 'pwa-manual';
export type GarageState = 'closed' | 'opening' | 'open' | 'closing' | 'security-blocked';

export interface GarageEvent {
  id: string;
  timestamp: string;
  mode: AccessMode;
  plateOrTag: string;
  authorized: boolean;
  snapshotId?: string;
  nightWindow?: boolean;
}

export const ACCESS_MODE_LABELS: Record<AccessMode, string> = {
  alpr: 'ALPR (камера)',
  'uhf-rfid': 'UHF RFID',
  'pwa-manual': 'PWA Manual',
};

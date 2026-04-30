import { Gateway, InfraEvent, GarageEvent } from '@/types/infrastructure';

const now = Date.now();
const iso = (offsetMin: number) => new Date(now - offsetMin * 60000).toISOString();

export const mockGateways: Gateway[] = [
  {
    id: 'gw-sofia-hq',
    name: 'Vivacom HQ Gateway',
    location: 'София — Централа',
    status: 'online',
    uptimeHours: 482,
    latencyMs: 18,
    cpuTempC: 54,
    lastHeartbeat: iso(0.2),
    firmware: 'v3.4.1',
  },
  {
    id: 'gw-mall',
    name: 'The Mall Edge',
    location: 'София — The Mall',
    status: '5g-backup',
    uptimeHours: 211,
    latencyMs: 64,
    cpuTempC: 61,
    lastHeartbeat: iso(0.5),
    firmware: 'v3.4.0',
  },
  {
    id: 'gw-ndk',
    name: 'НДК Gateway',
    location: 'София — НДК',
    status: 'online',
    uptimeHours: 98,
    latencyMs: 22,
    cpuTempC: 49,
    lastHeartbeat: iso(0.1),
    firmware: 'v3.4.1',
  },
  {
    id: 'gw-paradise',
    name: 'Paradise Center',
    location: 'София — Paradise',
    status: 'offline',
    uptimeHours: 0,
    latencyMs: 0,
    cpuTempC: 0,
    lastHeartbeat: iso(42),
    firmware: 'v3.3.8',
  },
];

export const mockInfraEvents: InfraEvent[] = [
  {
    id: 'ie-001',
    timestamp: iso(42),
    gatewayId: 'gw-paradise',
    gatewayName: 'Paradise Center',
    type: 'gateway-disconnect',
    severity: 'critical',
    message: 'MQTT heartbeat изгубен > 30s',
  },
  {
    id: 'ie-002',
    timestamp: iso(35),
    gatewayId: 'gw-mall',
    gatewayName: 'The Mall Edge',
    type: '5g-failover',
    severity: 'warning',
    message: 'Превключване на 5G резервна връзка',
  },
  {
    id: 'ie-003',
    timestamp: iso(120),
    gatewayId: 'gw-sofia-hq',
    gatewayName: 'Vivacom HQ Gateway',
    type: 'manual-override',
    severity: 'info',
    message: 'Ръчно отключване на главен вход',
    operator: 'admin@vivacom.bg',
  },
  {
    id: 'ie-004',
    timestamp: iso(360),
    gatewayId: 'gw-ndk',
    gatewayName: 'НДК Gateway',
    type: 'power-failure',
    severity: 'critical',
    message: 'Кратък срив на захранването (UPS активен)',
  },
];

export const mockGarageEvents: GarageEvent[] = [
  {
    id: 'ge-001',
    timestamp: iso(4),
    mode: 'alpr',
    plateOrTag: 'CB 4521 PT',
    authorized: true,
  },
  {
    id: 'ge-002',
    timestamp: iso(18),
    mode: 'uhf-rfid',
    plateOrTag: 'TAG-9821',
    authorized: true,
  },
  {
    id: 'ge-003',
    timestamp: iso(55),
    mode: 'pwa-manual',
    plateOrTag: 'manual:elena@vivacom.bg',
    authorized: true,
  },
  {
    id: 'ge-004',
    timestamp: iso(180),
    mode: 'uhf-rfid',
    plateOrTag: 'TAG-UNKNOWN-44A1',
    authorized: false,
    snapshotId: 'snap-2026-04-30-0312',
    nightWindow: true,
  },
];

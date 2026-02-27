// Types for IoT Dashboard data structures
// Ready for MQTT/flespi API integration

export interface Device {
  id: string;
  name: string;
  type: 'sensor' | 'controller' | 'gateway' | 'access-point';
  status: 'online' | 'offline' | 'warning';
  lastSeen: string;
  location?: string;
}

export interface SensorReading {
  id: string;
  deviceId: string;
  type: 'temperature' | 'humidity' | 'door' | 'motion' | 'pressure';
  value: number | boolean | string;
  unit?: string;
  status: 'ok' | 'alert' | 'warning';
  timestamp: string;
  location: string;
}

export interface AccessEntry {
  id: string;
  personName: string;
  personId: string;
  time: string;
  accessPoint: string;
  status: 'granted' | 'denied';
  method: 'card' | 'biometric' | 'pin' | 'mobile';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  result: 'success' | 'failure' | 'warning';
  details?: string;
  category: 'access' | 'system' | 'sensor' | 'security';
}

export interface DashboardStats {
  totalDevices: number;
  activeAlerts: number;
  personnelOnSite: number;
  devicesOnline: number;
  devicesOffline: number;
}

// MQTT/Flespi message structure
export interface MQTTMessage<T = unknown> {
  topic: string;
  payload: T;
  timestamp: string;
  qos: 0 | 1 | 2;
}

// API Response wrapper
export interface APIResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
}

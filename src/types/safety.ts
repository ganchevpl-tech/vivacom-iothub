// Patient Safety & Visitor Management Types

export type ZoneType = 'safe' | 'exit' | 'unauthorized' | 'restricted';
export type AlertLevel = 'panic' | 'warning' | 'info';
export type IdentificationMethod = 'rfid' | 'wifi' | 'face-id';
export type PatientRiskLevel = 'high' | 'medium' | 'low';

export interface Patient {
  id: string;
  name: string;
  roomNumber: string;
  riskLevel: PatientRiskLevel;
  identificationMethod: IdentificationMethod;
  conditions: string[];
  photo?: string;
}

export interface SafeZone {
  id: string;
  name: string;
  accessPointId: string;
  zoneType: ZoneType;
  description: string;
}

export interface SafetyAlert {
  id: string;
  patientId: string;
  patientName: string;
  zoneId: string;
  zoneName: string;
  zoneType: ZoneType;
  alertLevel: AlertLevel;
  timestamp: string;
  identificationMethod: IdentificationMethod;
  acknowledged: boolean;
  description: string;
}

export interface NightWanderingEvent {
  id: string;
  patientId: string;
  patientName: string;
  detectedAt: string;
  zoneName: string;
  identificationMethod: IdentificationMethod;
  duration: number; // minutes
  resolved: boolean;
}

export interface Visitor {
  id: string;
  name: string;
  purpose: string;
  hostEmployee: string;
  accessGrantedAt: string;
  expiresAt: string;
  identificationMethod: IdentificationMethod;
  accessPointIds: string[];
  isActive: boolean;
}

export const ZONE_COLORS: Record<ZoneType, string> = {
  safe: 'bg-status-ok/15 text-status-ok border-status-ok/30',
  exit: 'bg-status-alert/15 text-status-alert border-status-alert/30',
  unauthorized: 'bg-status-alert/15 text-status-alert border-status-alert/30',
  restricted: 'bg-status-warning/15 text-status-warning border-status-warning/30',
};

export const ID_METHOD_ICONS: Record<IdentificationMethod, string> = {
  rfid: '🪪',
  wifi: '📱',
  'face-id': '📷',
};

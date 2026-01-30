// Bulgarian Labor Code (KT) Compliance Types
// Art. 136: Fixed 8-hour workday
// Art. 142: Summarized Working Time (SVRV)

export type EmployeeGroup = 'standard' | 'flexible' | 'medical';

export type AttendanceStatus = 'completed' | 'night-shift' | 'rest-violation' | 'in-progress';

export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  group: EmployeeGroup;
  department: string;
  position: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  firstIn: string | null;
  lastOut: string | null;
  accessPointId: string;
  location: string;
}

export interface CalculatedAttendance {
  employee: Employee;
  date: string;
  firstIn: string | null;
  lastOut: string | null;
  location: string;
  rawHours: number;
  nightHours: number;
  effectiveNightHours: number; // nightHours * 1.143
  lunchDeduction: number;
  totalEffectiveHours: number;
  status: AttendanceStatus;
  restViolation: boolean;
  restHoursSinceLast: number | null;
}

export interface WeeklyProgress {
  employeeId: string;
  weekStart: string;
  hoursCompleted: number;
  hoursRequired: number;
  percentComplete: number;
  daysWorked: number;
}

export interface LocationHoursSummary {
  locationId: string;
  locationName: string;
  totalHoursToday: number;
  employeeCount: number;
  entries: {
    employeeName: string;
    hours: number;
  }[];
}

// Bulgarian Labor Code constants
export const LABOR_CONSTANTS = {
  // Night shift coefficient (Art. 140a KT)
  NIGHT_COEFFICIENT: 1.143,
  // Night shift hours (22:00 - 06:00)
  NIGHT_START_HOUR: 22,
  NIGHT_END_HOUR: 6,
  // Standard workday hours
  STANDARD_HOURS: 8,
  // Weekly hours for flexible/SVRV
  WEEKLY_HOURS: 40,
  // Minimum rest between shifts (Art. 152 KT)
  MIN_REST_HOURS: 12,
  // Lunch break deduction in hours
  LUNCH_BREAK_HOURS: 0.5,
  // Medical shift hours
  MEDICAL_SHIFT_HOURS: 12,
} as const;

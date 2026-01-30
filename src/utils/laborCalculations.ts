import {
  Employee,
  AttendanceRecord,
  CalculatedAttendance,
  AttendanceStatus,
  LocationHoursSummary,
  LABOR_CONSTANTS,
} from '@/types/labor';

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate night hours between two times
 * Night hours are between 22:00 and 06:00 (Art. 140a KT)
 */
function calculateNightHours(firstIn: string, lastOut: string): number {
  const inMinutes = parseTimeToMinutes(firstIn);
  const outMinutes = parseTimeToMinutes(lastOut);
  
  const nightStartMinutes = LABOR_CONSTANTS.NIGHT_START_HOUR * 60; // 22:00 = 1320
  const nightEndMinutes = LABOR_CONSTANTS.NIGHT_END_HOUR * 60; // 06:00 = 360
  
  let nightMinutes = 0;
  
  // Handle overnight shifts (e.g., 22:00 to 06:00)
  if (outMinutes < inMinutes) {
    // Shift crosses midnight
    // Night hours from start to midnight (if started before 22:00, count from 22:00)
    const nightStart = Math.max(inMinutes, nightStartMinutes);
    nightMinutes += 24 * 60 - nightStart; // Minutes until midnight
    
    // Night hours from midnight to end (until 06:00 or actual end)
    nightMinutes += Math.min(outMinutes, nightEndMinutes);
  } else {
    // Same day shift
    // Check for evening night hours (22:00 onwards)
    if (inMinutes < nightStartMinutes && outMinutes > nightStartMinutes) {
      nightMinutes += outMinutes - nightStartMinutes;
    } else if (inMinutes >= nightStartMinutes) {
      nightMinutes += outMinutes - inMinutes;
    }
    
    // Check for morning night hours (before 06:00)
    if (inMinutes < nightEndMinutes) {
      const endTime = Math.min(outMinutes, nightEndMinutes);
      nightMinutes += endTime - inMinutes;
    }
  }
  
  return Math.max(0, nightMinutes / 60);
}

/**
 * Calculate total working hours between first in and last out
 */
function calculateRawHours(firstIn: string, lastOut: string | null): number {
  if (!lastOut) {
    // Still at work - calculate from first in to now
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const inMinutes = parseTimeToMinutes(firstIn);
    
    if (nowMinutes >= inMinutes) {
      return (nowMinutes - inMinutes) / 60;
    }
    // Crossed midnight
    return (24 * 60 - inMinutes + nowMinutes) / 60;
  }
  
  const inMinutes = parseTimeToMinutes(firstIn);
  const outMinutes = parseTimeToMinutes(lastOut);
  
  if (outMinutes >= inMinutes) {
    return (outMinutes - inMinutes) / 60;
  }
  // Crossed midnight
  return (24 * 60 - inMinutes + outMinutes) / 60;
}

/**
 * Calculate rest hours since last shift
 */
function calculateRestHours(
  currentFirstIn: string,
  previousLastOut: string | null
): number | null {
  if (!previousLastOut) return null;
  
  const currentInMinutes = parseTimeToMinutes(currentFirstIn);
  const previousOutMinutes = parseTimeToMinutes(previousLastOut);
  
  // Assuming same day for simplicity in mock
  // In real implementation, would use full timestamps
  let restMinutes = currentInMinutes - previousOutMinutes;
  if (restMinutes < 0) {
    // Previous day
    restMinutes += 24 * 60;
  }
  
  return restMinutes / 60;
}

/**
 * Determine attendance status
 */
function determineStatus(
  employee: Employee,
  lastOut: string | null,
  nightHours: number,
  restViolation: boolean
): AttendanceStatus {
  if (restViolation) return 'rest-violation';
  if (!lastOut && nightHours > 0) return 'night-shift';
  if (!lastOut) return 'in-progress';
  return 'completed';
}

/**
 * Calculate attendance with KT compliance
 */
export function calculateAttendance(
  employee: Employee,
  record: AttendanceRecord,
  previousRecord?: AttendanceRecord
): CalculatedAttendance {
  const { firstIn, lastOut, location } = record;
  
  if (!firstIn) {
    return {
      employee,
      date: record.date,
      firstIn: null,
      lastOut: null,
      location,
      rawHours: 0,
      nightHours: 0,
      effectiveNightHours: 0,
      lunchDeduction: 0,
      totalEffectiveHours: 0,
      status: 'in-progress',
      restViolation: false,
      restHoursSinceLast: null,
    };
  }
  
  const rawHours = calculateRawHours(firstIn, lastOut);
  const nightHours = lastOut ? calculateNightHours(firstIn, lastOut) : 0;
  const effectiveNightHours = nightHours * LABOR_CONSTANTS.NIGHT_COEFFICIENT;
  
  // Calculate rest hours and check for violation
  const restHoursSinceLast = previousRecord?.lastOut
    ? calculateRestHours(firstIn, previousRecord.lastOut)
    : null;
  const restViolation = restHoursSinceLast !== null && restHoursSinceLast < LABOR_CONSTANTS.MIN_REST_HOURS;
  
  // Lunch deduction applies to standard and flexible, not medical/shift workers
  const lunchDeduction = 
    employee.group !== 'medical' && rawHours >= 6
      ? LABOR_CONSTANTS.LUNCH_BREAK_HOURS
      : 0;
  
  // Calculate total effective hours
  // Night hours are already included in raw hours, so we add the bonus coefficient
  const nightBonus = nightHours * (LABOR_CONSTANTS.NIGHT_COEFFICIENT - 1);
  const totalEffectiveHours = Math.max(0, rawHours - lunchDeduction + nightBonus);
  
  const status = determineStatus(employee, lastOut, nightHours, restViolation);
  
  return {
    employee,
    date: record.date,
    firstIn,
    lastOut,
    location,
    rawHours,
    nightHours,
    effectiveNightHours,
    lunchDeduction,
    totalEffectiveHours,
    status,
    restViolation,
    restHoursSinceLast,
  };
}

/**
 * Calculate hours by location for map integration
 */
export function calculateLocationHours(
  records: AttendanceRecord[],
  employees: Employee[]
): LocationHoursSummary[] {
  const locationMap = new Map<string, LocationHoursSummary>();
  
  records.forEach((record) => {
    const employee = employees.find((e) => e.id === record.employeeId);
    if (!employee || !record.firstIn) return;
    
    const hours = calculateRawHours(record.firstIn, record.lastOut);
    
    if (!locationMap.has(record.accessPointId)) {
      locationMap.set(record.accessPointId, {
        locationId: record.accessPointId,
        locationName: record.location,
        totalHoursToday: 0,
        employeeCount: 0,
        entries: [],
      });
    }
    
    const summary = locationMap.get(record.accessPointId)!;
    summary.totalHoursToday += hours;
    summary.employeeCount += 1;
    summary.entries.push({
      employeeName: employee.name,
      hours,
    });
  });
  
  return Array.from(locationMap.values());
}

/**
 * Format hours for display (e.g., 8.5 -> "8h 30m")
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format time for display
 */
export function formatTime(time: string | null): string {
  if (!time) return '—';
  return time;
}

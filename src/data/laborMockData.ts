import { Employee, AttendanceRecord, EmployeeGroup } from '@/types/labor';

// Mock employees with different work groups
export const mockEmployees: Employee[] = [
  {
    id: 'emp-001',
    name: 'Stefan Ivanov',
    employeeId: 'EMP-001',
    group: 'standard',
    department: 'IT Operations',
    position: 'Network Engineer',
  },
  {
    id: 'emp-002',
    name: 'Maria Petrova',
    employeeId: 'EMP-042',
    group: 'flexible',
    department: 'Software Development',
    position: 'Senior Developer',
  },
  {
    id: 'emp-003',
    name: 'Georgi Todorov',
    employeeId: 'EMP-103',
    group: 'medical',
    department: 'Security',
    position: 'Night Guard',
  },
  {
    id: 'emp-004',
    name: 'Elena Dimitrova',
    employeeId: 'EMP-087',
    group: 'standard',
    department: 'Customer Support',
    position: 'Support Lead',
  },
  {
    id: 'emp-005',
    name: 'Nikola Georgiev',
    employeeId: 'EMP-156',
    group: 'flexible',
    department: 'Data Center',
    position: 'Systems Admin',
  },
  {
    id: 'emp-006',
    name: 'Yana Koleva',
    employeeId: 'EMP-089',
    group: 'medical',
    department: 'Security',
    position: 'Security Officer',
  },
  {
    id: 'emp-007',
    name: 'Dimitar Petkov',
    employeeId: 'EMP-201',
    group: 'standard',
    department: 'Finance',
    position: 'Financial Analyst',
  },
  {
    id: 'emp-008',
    name: 'Ivana Stoyanova',
    employeeId: 'EMP-178',
    group: 'flexible',
    department: 'Marketing',
    position: 'Marketing Manager',
  },
];

// Generate today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// Mock attendance records with various scenarios
export const mockAttendanceRecords: AttendanceRecord[] = [
  // Stefan - Standard, completed day
  {
    id: 'att-001',
    employeeId: 'emp-001',
    date: today,
    firstIn: '08:45',
    lastOut: '17:30',
    accessPointId: 'viva-hq',
    location: 'Vivacom Headquarters',
  },
  // Maria - Flexible, still working
  {
    id: 'att-002',
    employeeId: 'emp-002',
    date: today,
    firstIn: '10:15',
    lastOut: null, // Still at work
    accessPointId: 'viva-hq',
    location: 'Vivacom Headquarters',
  },
  // Georgi - Night shift (started yesterday evening)
  {
    id: 'att-003',
    employeeId: 'emp-003',
    date: today,
    firstIn: '22:00',
    lastOut: '06:00',
    accessPointId: 'the-mall',
    location: 'The Mall Sofia',
  },
  // Elena - Standard, completed
  {
    id: 'att-004',
    employeeId: 'emp-004',
    date: today,
    firstIn: '09:00',
    lastOut: '18:00',
    accessPointId: 'paradise-center',
    location: 'Paradise Center',
  },
  // Nikola - Flexible, rest violation (worked yesterday until 23:00)
  {
    id: 'att-005',
    employeeId: 'emp-005',
    date: today,
    firstIn: '07:30',
    lastOut: '16:00',
    accessPointId: 'viva-hq',
    location: 'Vivacom Headquarters',
  },
  // Yana - Medical shift, currently on night shift
  {
    id: 'att-006',
    employeeId: 'emp-006',
    date: today,
    firstIn: '19:00',
    lastOut: null, // Currently on shift
    accessPointId: 'ndk',
    location: 'National Palace of Culture',
  },
  // Dimitar - Standard, partial day
  {
    id: 'att-007',
    employeeId: 'emp-007',
    date: today,
    firstIn: '08:30',
    lastOut: '14:00',
    accessPointId: 'viva-hq',
    location: 'Vivacom Headquarters',
  },
  // Ivana - Flexible, completed
  {
    id: 'att-008',
    employeeId: 'emp-008',
    date: today,
    firstIn: '11:00',
    lastOut: '19:30',
    accessPointId: 'the-mall',
    location: 'The Mall Sofia',
  },
];

// Previous day records (for rest violation calculation)
export const mockPreviousDayRecords: AttendanceRecord[] = [
  // Nikola worked late yesterday - will cause rest violation
  {
    id: 'att-prev-005',
    employeeId: 'emp-005',
    date: yesterday,
    firstIn: '14:00',
    lastOut: '23:00',
    accessPointId: 'viva-hq',
    location: 'Vivacom Headquarters',
  },
  // Maria's flexible hours from previous days this week
  {
    id: 'att-prev-002-1',
    employeeId: 'emp-002',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    firstIn: '09:00',
    lastOut: '18:00',
    accessPointId: 'viva-hq',
    location: 'Vivacom Headquarters',
  },
  {
    id: 'att-prev-002-2',
    employeeId: 'emp-002',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    firstIn: '10:00',
    lastOut: '19:00',
    accessPointId: 'viva-hq',
    location: 'Vivacom Headquarters',
  },
];

// Weekly progress for flexible employees
export const mockWeeklyProgress = [
  {
    employeeId: 'emp-002',
    weekStart: getWeekStart(),
    hoursCompleted: 26.5,
    hoursRequired: 40,
    percentComplete: 66.25,
    daysWorked: 3,
  },
  {
    employeeId: 'emp-005',
    weekStart: getWeekStart(),
    hoursCompleted: 32,
    hoursRequired: 40,
    percentComplete: 80,
    daysWorked: 4,
  },
  {
    employeeId: 'emp-008',
    weekStart: getWeekStart(),
    hoursCompleted: 38,
    hoursRequired: 40,
    percentComplete: 95,
    daysWorked: 4,
  },
];

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

// Group labels for UI
export const groupLabels: Record<EmployeeGroup, string> = {
  standard: 'Standard (8h)',
  flexible: 'Flexible/SVRV',
  medical: 'Medical/Shifts',
};

export const groupDescriptions: Record<EmployeeGroup, string> = {
  standard: 'Fixed 8-hour day (Art. 136 KT)',
  flexible: 'Summarized working time (Art. 142 KT)',
  medical: '12h/24h shift schedule',
};

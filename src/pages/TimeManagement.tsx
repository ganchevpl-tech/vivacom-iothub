import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AttendanceTable } from '@/components/labor/AttendanceTable';
import { FlexibleGroupSummary } from '@/components/labor/FlexibleGroupSummary';
import { AccessPointsMap } from '@/components/dashboard/AccessPointsMap';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  mockEmployees, 
  mockAttendanceRecords, 
  mockPreviousDayRecords,
  mockWeeklyProgress,
  groupLabels 
} from '@/data/laborMockData';
import { calculateAttendance, calculateLocationHours } from '@/utils/laborCalculations';
import { LABOR_CONSTANTS } from '@/types/labor';
import { Clock, Users, Moon, AlertTriangle } from 'lucide-react';

const TimeManagement = () => {
  // Calculate attendance for all employees
  const attendanceData = useMemo(() => {
    return mockAttendanceRecords.map((record) => {
      const employee = mockEmployees.find((e) => e.id === record.employeeId);
      if (!employee) return null;
      
      const previousRecord = mockPreviousDayRecords.find(
        (r) => r.employeeId === record.employeeId
      );
      
      return calculateAttendance(employee, record, previousRecord);
    }).filter(Boolean);
  }, []);
  
  // Calculate location hours for map integration
  const locationHours = useMemo(() => {
    return calculateLocationHours(mockAttendanceRecords, mockEmployees);
  }, []);
  
  // Calculate summary stats
  const stats = useMemo(() => {
    const totalEmployees = attendanceData.length;
    const nightShiftCount = attendanceData.filter(
      (a) => a && (a.status === 'night-shift' || a.nightHours > 0)
    ).length;
    const restViolations = attendanceData.filter(
      (a) => a && a.restViolation
    ).length;
    const totalHoursToday = attendanceData.reduce(
      (sum, a) => sum + (a?.totalEffectiveHours || 0), 
      0
    );
    
    return { totalEmployees, nightShiftCount, restViolations, totalHoursToday };
  }, [attendanceData]);

  return (
    <DashboardLayout 
      title="Time Management" 
      subtitle="Bulgarian Labor Code (KT) compliant tracking"
    >
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Today"
            value={stats.totalEmployees}
            subtitle="Employees tracked"
            icon={Users}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Total Hours"
            value={`${stats.totalHoursToday.toFixed(1)}h`}
            subtitle="Effective hours today"
            icon={Clock}
            delay={0.1}
          />
          <StatCard
            title="Night Shifts"
            value={stats.nightShiftCount}
            subtitle={`${LABOR_CONSTANTS.NIGHT_COEFFICIENT}x coefficient`}
            icon={Moon}
            delay={0.2}
          />
          <StatCard
            title="Rest Violations"
            value={stats.restViolations}
            subtitle={`<${LABOR_CONSTANTS.MIN_REST_HOURS}h between shifts`}
            icon={AlertTriangle}
            variant={stats.restViolations > 0 ? 'alert' : 'default'}
            delay={0.3}
          />
        </div>
        
        {/* Main Attendance Table */}
        <AttendanceTable data={attendanceData.filter(Boolean) as any} />
        
        {/* Flexible Group & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FlexibleGroupSummary progressData={mockWeeklyProgress} />
          <AccessPointsMap locationHours={locationHours} />
        </div>
        
        {/* KT Reference Card */}
        <div className="bg-card rounded-xl shadow-card border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Bulgarian Labor Code Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-primary">Standard (Art. 136 KT)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Fixed 8-hour workday</li>
                <li>• 30-minute lunch break</li>
                <li>• 40-hour work week</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-amber-400">Flexible/SVRV (Art. 142 KT)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Summarized working time</li>
                <li>• Weekly 40h aggregation</li>
                <li>• Flexible daily hours</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-emerald-400">Night Work (Art. 140a KT)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Hours 22:00 - 06:00</li>
                <li>• 1.143x conversion coefficient</li>
                <li>• 12h minimum rest (Art. 152)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TimeManagement;

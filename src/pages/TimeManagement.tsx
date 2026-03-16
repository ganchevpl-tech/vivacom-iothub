import { useMemo, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AttendanceTable } from '@/components/labor/AttendanceTable';
import { FlexibleGroupSummary } from '@/components/labor/FlexibleGroupSummary';
import { AccessPointsMap } from '@/components/dashboard/AccessPointsMap';
import { StatCard } from '@/components/dashboard/StatCard';
import { PanicAlertBanner } from '@/components/safety/PanicAlertBanner';
import { SafeZoneMonitor } from '@/components/safety/SafeZoneMonitor';
import { NightWanderingLog } from '@/components/safety/NightWanderingLog';
import { VisitorTracker } from '@/components/safety/VisitorTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  mockEmployees, 
  mockAttendanceRecords, 
  mockPreviousDayRecords,
  mockWeeklyProgress,
} from '@/data/laborMockData';
import {
  mockSafetyAlerts,
  mockSafeZones,
  mockNightWandering,
  mockVisitors,
  mockPatients,
} from '@/data/safetyMockData';
import { calculateAttendance, calculateLocationHours } from '@/utils/laborCalculations';
import { LABOR_CONSTANTS } from '@/types/labor';
import { Clock, Users, Moon, TriangleAlert as AlertTriangle, Shield, UserCheck, Briefcase, HeartPulse } from 'lucide-react';

const TimeManagement = () => {
  const [activeView, setActiveView] = useState<'hr' | 'safety'>('hr');
  const [alerts, setAlerts] = useState(mockSafetyAlerts);

  const handleAcknowledge = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

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
  
  const locationHours = useMemo(() => {
    return calculateLocationHours(mockAttendanceRecords, mockEmployees);
  }, []);
  
  const stats = useMemo(() => {
    const totalEmployees = attendanceData.length;
    const nightShiftCount = attendanceData.filter(
      (a) => a && (a.status === 'night-shift' || a.nightHours > 0)
    ).length;
    const restViolations = attendanceData.filter(
      (a) => a && a.restViolation
    ).length;
    const totalHoursToday = attendanceData.reduce(
      (sum, a) => sum + (a?.totalEffectiveHours || 0), 0
    );
    return { totalEmployees, nightShiftCount, restViolations, totalHoursToday };
  }, [attendanceData]);

  const safetyStats = useMemo(() => {
    const activeAlerts = alerts.filter((a) => !a.acknowledged).length;
    const totalPatients = mockPatients.length;
    const highRisk = mockPatients.filter((p) => p.riskLevel === 'high').length;
    const activeVisitors = mockVisitors.filter((v) => v.isActive).length;
    return { activeAlerts, totalPatients, highRisk, activeVisitors };
  }, [alerts]);

  return (
    <DashboardLayout 
      title="Access & Safety System" 
      subtitle="Integrated HR & Patient Safety Management"
    >
      <div className="space-y-6">
        {/* Panic Alerts always visible */}
        <PanicAlertBanner alerts={alerts} onAcknowledge={handleAcknowledge} />

        {/* View Toggle */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'hr' | 'safety')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="hr" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Business HR View
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4" />
              Patient Safety View
            </TabsTrigger>
          </TabsList>

          {/* ========== HR VIEW ========== */}
          <TabsContent value="hr">
            <div className="space-y-8 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Active Today" value={stats.totalEmployees} subtitle="Employees tracked" icon={Users} variant="primary" delay={0} />
                <StatCard title="Total Hours" value={`${stats.totalHoursToday.toFixed(1)}h`} subtitle="Effective hours today" icon={Clock} delay={0.1} />
                <StatCard title="Night Shifts" value={stats.nightShiftCount} subtitle={`${LABOR_CONSTANTS.NIGHT_COEFFICIENT}x coefficient`} icon={Moon} delay={0.2} />
                <StatCard title="Rest Violations" value={stats.restViolations} subtitle={`<${LABOR_CONSTANTS.MIN_REST_HOURS}h between shifts`} icon={AlertTriangle} variant={stats.restViolations > 0 ? 'alert' : 'default'} delay={0.3} />
              </div>

              <AttendanceTable data={attendanceData.filter(Boolean) as any} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FlexibleGroupSummary progressData={mockWeeklyProgress} />
                <VisitorTracker visitors={mockVisitors} />
              </div>

              <AccessPointsMap locationHours={locationHours} />

              {/* KT Reference */}
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
                    <h4 className="font-medium text-status-warning">Flexible/SVRV (Art. 142 KT)</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Summarized working time</li>
                      <li>• Weekly 40h aggregation</li>
                      <li>• Flexible daily hours</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-status-ok">Night Work (Art. 140a KT)</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Hours 22:00 - 06:00</li>
                      <li>• 1.143x conversion coefficient</li>
                      <li>• 12h minimum rest (Art. 152)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ========== PATIENT SAFETY VIEW ========== */}
          <TabsContent value="safety">
            <div className="space-y-8 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Active Alerts" value={safetyStats.activeAlerts} subtitle="Unacknowledged" icon={AlertTriangle} variant={safetyStats.activeAlerts > 0 ? 'alert' : 'default'} delay={0} />
                <StatCard title="Patients Monitored" value={safetyStats.totalPatients} subtitle={`${safetyStats.highRisk} high-risk`} icon={HeartPulse} variant="primary" delay={0.1} />
                <StatCard title="Safe Zones" value={mockSafeZones.length} subtitle="Configured zones" icon={Shield} delay={0.2} />
                <StatCard title="Active Visitors" value={safetyStats.activeVisitors} subtitle="Temporary access" icon={UserCheck} delay={0.3} />
              </div>

              <SafeZoneMonitor zones={mockSafeZones} alerts={alerts} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NightWanderingLog events={mockNightWandering} />
                <VisitorTracker visitors={mockVisitors} />
              </div>

              <AccessPointsMap locationHours={locationHours} />

              {/* ID Methods Legend */}
              <div className="bg-card rounded-xl shadow-card border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Identification Methods
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="text-3xl">🪪</span>
                    <div>
                      <h4 className="font-medium text-foreground">RFID Badge</h4>
                      <p className="text-xs text-muted-foreground">Proximity card scanning</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="text-3xl">📱</span>
                    <div>
                      <h4 className="font-medium text-foreground">Wi-Fi Detection</h4>
                      <p className="text-xs text-muted-foreground">Mobile device tracking</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="text-3xl">📷</span>
                    <div>
                      <h4 className="font-medium text-foreground">Face ID</h4>
                      <p className="text-xs text-muted-foreground">Biometric recognition</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TimeManagement;

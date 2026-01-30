import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CalculatedAttendance, LABOR_CONSTANTS } from '@/types/labor';
import { formatHours, formatTime } from '@/utils/laborCalculations';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';
import { EmployeeGroupBadge } from './EmployeeGroupBadge';
import { WeeklyProgressBar } from './WeeklyProgressBar';
import { mockWeeklyProgress } from '@/data/laborMockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Moon, AlertTriangle, Clock, MapPin } from 'lucide-react';

interface AttendanceTableProps {
  data: CalculatedAttendance[];
  className?: string;
}

export function AttendanceTable({ data, className }: AttendanceTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('bg-card rounded-xl shadow-card border border-border', className)}
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Attendance & Time Management
            </h3>
            <p className="text-sm text-muted-foreground">
              Bulgarian Labor Code (KT) compliant tracking
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-muted-foreground">Night: 22:00-06:00</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-primary font-medium">×{LABOR_CONSTANTS.NIGHT_COEFFICIENT}</span>
              <span className="text-muted-foreground">coefficient</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px]">Employee</TableHead>
              <TableHead className="w-[120px]">Group</TableHead>
              <TableHead className="w-[100px] text-center">First In</TableHead>
              <TableHead className="w-[100px] text-center">Last Out</TableHead>
              <TableHead className="w-[100px] text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dashed border-muted-foreground">
                      Night Hours
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hours between 22:00-06:00</p>
                    <p className="text-xs text-muted-foreground">
                      Multiplied by {LABOR_CONSTANTS.NIGHT_COEFFICIENT}x coefficient
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="w-[120px] text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dashed border-muted-foreground">
                      Total Effective
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Raw hours + night bonus - lunch break</p>
                    <p className="text-xs text-muted-foreground">
                      30min lunch deducted for Standard/Flexible
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record, index) => {
              const weeklyProgress = mockWeeklyProgress.find(
                (p) => p.employeeId === record.employee.id
              );
              
              return (
                <TableRow
                  key={record.employee.id}
                  className={cn(
                    'group',
                    record.restViolation && 'bg-status-alert/5'
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {record.employee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {record.employee.name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {record.location}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-2">
                      <EmployeeGroupBadge group={record.employee.group} />
                      {record.employee.group === 'flexible' && weeklyProgress && (
                        <WeeklyProgressBar
                          progress={weeklyProgress}
                          showDetails={false}
                          className="max-w-[150px]"
                        />
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center font-mono text-sm">
                    {formatTime(record.firstIn)}
                  </TableCell>
                  
                  <TableCell className="text-center font-mono text-sm">
                    {record.lastOut ? (
                      formatTime(record.lastOut)
                    ) : (
                      <span className="inline-flex items-center gap-1 text-status-warning">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Active
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {record.nightHours > 0 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 text-purple-400 font-medium">
                            <Moon className="w-3.5 h-3.5" />
                            {formatHours(record.nightHours)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Effective: {formatHours(record.effectiveNightHours)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ({record.nightHours.toFixed(1)}h × {LABOR_CONSTANTS.NIGHT_COEFFICIENT})
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <span className="font-semibold text-lg text-foreground">
                      {formatHours(record.totalEffectiveHours)}
                    </span>
                    {record.lunchDeduction > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 text-xs text-muted-foreground cursor-help">
                            *
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          30min lunch break deducted
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <AttendanceStatusBadge status={record.status} />
                      {record.restViolation && record.restHoursSinceLast !== null && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 text-xs text-status-alert">
                              <AlertTriangle className="w-3 h-3" />
                              Rest: {formatHours(record.restHoursSinceLast)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Rest period violation (Art. 152 KT)</p>
                            <p className="text-xs text-muted-foreground">
                              Minimum {LABOR_CONSTANTS.MIN_REST_HOURS}h required between shifts
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Legend */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-ok" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Night Shift</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-warning" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-alert animate-pulse" />
            <span>Rest Violation (&lt;12h)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

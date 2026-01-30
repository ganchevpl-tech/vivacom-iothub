import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { WeeklyProgress, LABOR_CONSTANTS } from '@/types/labor';
import { WeeklyProgressBar } from './WeeklyProgressBar';
import { mockEmployees } from '@/data/laborMockData';
import { Users, Clock, Target, TrendingUp } from 'lucide-react';

interface FlexibleGroupSummaryProps {
  progressData: WeeklyProgress[];
  className?: string;
}

export function FlexibleGroupSummary({ progressData, className }: FlexibleGroupSummaryProps) {
  const totalHours = progressData.reduce((sum, p) => sum + p.hoursCompleted, 0);
  const totalRequired = progressData.reduce((sum, p) => sum + p.hoursRequired, 0);
  const avgCompletion = progressData.length > 0
    ? progressData.reduce((sum, p) => sum + p.percentComplete, 0) / progressData.length
    : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn('bg-card rounded-xl shadow-card border border-border p-6', className)}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Flexible Group (SVRV)
          </h3>
          <p className="text-sm text-muted-foreground">
            Art. 142 KT - Summarized Working Time
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Target className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">
            {LABOR_CONSTANTS.WEEKLY_HOURS}h/week target
          </span>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Employees</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{progressData.length}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Total Hours</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {totalHours.toFixed(1)}h
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Avg. Progress</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {avgCompletion.toFixed(0)}%
          </p>
        </div>
      </div>
      
      {/* Individual Progress Bars */}
      <div className="space-y-4">
        {progressData.map((progress) => {
          const employee = mockEmployees.find((e) => e.id === progress.employeeId);
          if (!employee) return null;
          
          return (
            <div key={progress.employeeId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-500/10 flex items-center justify-center text-xs font-medium text-amber-400">
                    {employee.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {employee.name}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {progress.hoursCompleted.toFixed(1)}h / {progress.hoursRequired}h
                </span>
              </div>
              <WeeklyProgressBar progress={progress} showDetails={false} />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

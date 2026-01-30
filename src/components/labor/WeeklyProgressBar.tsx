import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { WeeklyProgress } from '@/types/labor';
import { LABOR_CONSTANTS } from '@/types/labor';
import { formatHours } from '@/utils/laborCalculations';
import { Clock, TrendingUp } from 'lucide-react';

interface WeeklyProgressBarProps {
  progress: WeeklyProgress;
  showDetails?: boolean;
  className?: string;
}

export function WeeklyProgressBar({ progress, showDetails = true, className }: WeeklyProgressBarProps) {
  const { hoursCompleted, hoursRequired, percentComplete, daysWorked } = progress;
  const remaining = hoursRequired - hoursCompleted;
  
  // Determine color based on progress
  const getProgressColor = () => {
    if (percentComplete >= 100) return 'bg-status-ok';
    if (percentComplete >= 75) return 'bg-amber-500';
    if (percentComplete >= 50) return 'bg-blue-500';
    return 'bg-blue-400';
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Weekly Progress (SVRV)</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-foreground">{formatHours(hoursCompleted)}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{LABOR_CONSTANTS.WEEKLY_HOURS}h</span>
          </div>
        </div>
      )}
      
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentComplete, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', getProgressColor())}
        />
        {/* 40-hour marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
          style={{ left: '100%', transform: 'translateX(-100%)' }}
        />
      </div>
      
      {showDetails && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{daysWorked} days worked this week</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {remaining > 0 
                ? `${formatHours(remaining)} remaining` 
                : 'Target met!'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

import { cn } from '@/lib/utils';
import { AttendanceStatus } from '@/types/labor';
import { CheckCircle, Moon, AlertTriangle, Clock } from 'lucide-react';

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  className?: string;
}

const statusConfig: Record<AttendanceStatus, {
  label: string;
  icon: typeof CheckCircle;
  className: string;
}> = {
  completed: {
    label: 'Completed Day',
    icon: CheckCircle,
    className: 'bg-status-ok/15 text-status-ok border-status-ok/30',
  },
  'night-shift': {
    label: 'Night Shift',
    icon: Moon,
    className: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  'rest-violation': {
    label: 'Rest Violation',
    icon: AlertTriangle,
    className: 'bg-status-alert/15 text-status-alert border-status-alert/30 animate-pulse',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Clock,
    className: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  },
};

export function AttendanceStatusBadge({ status, className }: AttendanceStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        config.className,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

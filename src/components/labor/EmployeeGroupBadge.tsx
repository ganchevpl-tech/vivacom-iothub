import { cn } from '@/lib/utils';
import { EmployeeGroup } from '@/types/labor';
import { groupLabels } from '@/data/laborMockData';

interface EmployeeGroupBadgeProps {
  group: EmployeeGroup;
  className?: string;
}

const groupStyles: Record<EmployeeGroup, string> = {
  standard: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  flexible: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  medical: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export function EmployeeGroupBadge({ group, className }: EmployeeGroupBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        groupStyles[group],
        className
      )}
    >
      {groupLabels[group]}
    </span>
  );
}

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export function LiveIndicator({ isConnected, className }: LiveIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <motion.span
        className={cn(
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-status-ok' : 'bg-status-alert'
        )}
        animate={isConnected ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span className={cn(
        'text-xs font-medium uppercase tracking-wider',
        isConnected ? 'text-status-ok' : 'text-status-alert'
      )}>
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}

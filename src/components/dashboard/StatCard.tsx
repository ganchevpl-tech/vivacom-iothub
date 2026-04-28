import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'alert';
  delay?: number;
}

const variantStyles = {
  default: 'bg-card border border-border',
  primary: 'gradient-primary text-primary-foreground',
  secondary: 'gradient-secondary text-secondary-foreground',
  alert: 'bg-status-alert text-primary-foreground',
};

const iconContainerStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  secondary: 'bg-secondary-foreground/20 text-secondary-foreground',
  alert: 'bg-primary-foreground/20 text-primary-foreground',
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default',
  delay = 0 
}: StatCardProps) {
  const isLight = variant !== 'default';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'rounded-xl p-6 shadow-card transition-all duration-300 hover:shadow-card-hover',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            'text-sm font-medium',
            isLight ? 'opacity-80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <motion.p
            key={String(value)}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.1, type: 'spring' }}
            className="text-4xl font-bold tracking-tight sensor-value"
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className={cn(
              'text-xs',
              isLight ? 'opacity-60' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend.isPositive ? (isLight ? 'text-white/90' : 'text-status-ok') : (isLight ? 'text-white/90' : 'text-status-alert')
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">vs last hour</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          'p-3 rounded-lg',
          iconContainerStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { CircleCheck as CheckCircle2, Circle as XCircle, CreditCard, Fingerprint, KeyRound, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccessEntry } from '@/types/dashboard';
import { formatDistanceToNow } from 'date-fns';
import { bg } from 'date-fns/locale';
import { LiveIndicator } from './LiveIndicator';

interface AccessControlListProps {
  entries: AccessEntry[];
  isConnected?: boolean;
  onViewAll?: () => void;
}

const methodIcons: Record<string, typeof CreditCard> = {
  card: CreditCard,
  biometric: Fingerprint,
  pin: KeyRound,
  mobile: Smartphone,
};

export function AccessControlList({ entries, isConnected = false, onViewAll }: AccessControlListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-xl shadow-card border border-border overflow-hidden"
    >
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Access Control</h3>
            <p className="text-sm text-muted-foreground">Recent entry attempts</p>
          </div>
          <LiveIndicator isConnected={isConnected} />
        </div>
      </div>

      <div className="divide-y divide-border">
        {entries.map((entry, index) => {
          const MethodIcon = methodIcons[entry.method] ?? KeyRound;
          const isGranted = entry.status === 'granted';
          
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  isGranted ? 'bg-status-ok/10' : 'bg-status-alert/10'
                )}>
                  {isGranted ? (
                    <CheckCircle2 className="w-5 h-5 text-status-ok" />
                  ) : (
                    <XCircle className="w-5 h-5 text-status-alert" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {entry.personName}
                    </p>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      isGranted 
                        ? 'bg-status-ok/10 text-status-ok' 
                        : 'bg-status-alert/10 text-status-alert'
                    )}>
                      {entry.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{entry.accessPoint}</span>
                    <span>•</span>
                    <span>{entry.time ? formatDistanceToNow(new Date(entry.time), { addSuffix: true, locale: bg }) : 'Неизвестно време'}</span>
                  </div>
                </div>

                {/* Method Icon */}
                <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                  <MethodIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {onViewAll && (
        <div className="p-4 bg-muted/30 border-t border-border">
          <button onClick={onViewAll} className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            View All Access Logs →
          </button>
        </div>
      )}
    </motion.div>
  );
}

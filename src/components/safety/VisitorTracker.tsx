import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Visitor, ID_METHOD_ICONS } from '@/types/safety';
import { UserCheck, Timer, TimerOff, MapPin } from 'lucide-react';
import { accessPoints } from '@/components/dashboard/AccessPointsMap';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VisitorTrackerProps {
  visitors: Visitor[];
  className?: string;
}

function TimeRemaining({ expiresAt, isActive }: { expiresAt: string; isActive: boolean }) {
  const [remaining, setRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setIsExpired(true);
        setRemaining('Expired');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!isActive || isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <TimerOff className="h-3 w-3" />
        Expired
      </span>
    );
  }

  const diff = new Date(expiresAt).getTime() - Date.now();
  const isUrgent = diff < 30 * 60000; // < 30 minutes

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-mono font-semibold',
        isUrgent ? 'text-status-warning animate-pulse' : 'text-status-ok'
      )}
    >
      <Timer className="h-3 w-3" />
      {remaining}
    </span>
  );
}

export function VisitorTracker({ visitors, className }: VisitorTrackerProps) {
  const activeCount = visitors.filter((v) => v.isActive).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn('bg-card rounded-xl shadow-card border border-border', className)}
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">Visitor Management</h3>
          </div>
          <span className="text-xs bg-secondary/15 text-secondary px-2.5 py-1 rounded-full font-semibold border border-secondary/30">
            {activeCount} active
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Temporary access tracking with auto-expiry
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Visitor</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>ID Method</TableHead>
              <TableHead className="text-center">Time Left</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitors.map((visitor) => (
              <TableRow
                key={visitor.id}
                className={cn(!visitor.isActive && 'opacity-50')}
              >
                <TableCell>
                  <p className="font-medium text-foreground text-sm">{visitor.name}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground">{visitor.purpose}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground">{visitor.hostEmployee}</p>
                </TableCell>
                <TableCell>
                  <span className="text-lg">{ID_METHOD_ICONS[visitor.identificationMethod]}</span>
                </TableCell>
                <TableCell className="text-center">
                  <TimeRemaining
                    expiresAt={visitor.expiresAt}
                    isActive={visitor.isActive}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}

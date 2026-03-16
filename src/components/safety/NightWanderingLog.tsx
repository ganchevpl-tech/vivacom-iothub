import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NightWanderingEvent, ID_METHOD_ICONS } from '@/types/safety';
import { Moon, CircleCheck as CheckCircle, Clock } from 'lucide-react';

interface NightWanderingLogProps {
  events: NightWanderingEvent[];
  className?: string;
}

export function NightWanderingLog({ events, className }: NightWanderingLogProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn('bg-card rounded-xl shadow-card border border-border', className)}
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-foreground">Night Wandering Log</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Unusual movement detected after midnight
        </p>
      </div>

      <div className="p-4 space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No night wandering events recorded
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border',
                event.resolved
                  ? 'bg-muted/30 border-border'
                  : 'bg-purple-500/10 border-purple-500/30'
              )}
            >
              <div className="mt-0.5">
                <span className="text-lg">{ID_METHOD_ICONS[event.identificationMethod]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-foreground">{event.patientName}</p>
                  {event.resolved ? (
                    <CheckCircle className="h-3.5 w-3.5 text-status-ok" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.zoneName} • {new Date(event.detectedAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {event.duration}m
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

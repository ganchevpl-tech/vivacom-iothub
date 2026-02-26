import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SafetyAlert, ID_METHOD_ICONS, ZONE_COLORS } from '@/types/safety';
import { AlertTriangle, X, Bell, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PanicAlertBannerProps {
  alerts: SafetyAlert[];
  onAcknowledge: (id: string) => void;
  className?: string;
}

export function PanicAlertBanner({ alerts, onAcknowledge, className }: PanicAlertBannerProps) {
  const activeAlerts = alerts.filter((a) => !a.acknowledged && a.alertLevel === 'panic');

  if (activeAlerts.length === 0) return null;

  return (
    <AnimatePresence>
      {activeAlerts.map((alert) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={cn(
            'relative overflow-hidden rounded-xl border-2 border-destructive bg-destructive/10 p-4',
            'animate-pulse shadow-[0_0_30px_hsl(var(--destructive)/0.3)]',
            className
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-destructive p-2">
                <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-destructive text-base">
                    🚨 PANIC ALERT
                  </h4>
                  <span className="text-lg">{ID_METHOD_ICONS[alert.identificationMethod]}</span>
                </div>
                <p className="text-sm text-foreground font-medium">{alert.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {alert.patientName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {alert.zoneName}
                  </span>
                  <span>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onAcknowledge(alert.id)}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Bell className="h-3.5 w-3.5" />
              Acknowledge
            </Button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

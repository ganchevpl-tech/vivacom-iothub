import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SafeZone, SafetyAlert, ZONE_COLORS, ID_METHOD_ICONS } from '@/types/safety';
import { Shield, AlertTriangle, DoorOpen, Lock, MapPin } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SafeZoneMonitorProps {
  zones: SafeZone[];
  alerts: SafetyAlert[];
  className?: string;
}

const zoneIcons = {
  safe: Shield,
  exit: DoorOpen,
  unauthorized: AlertTriangle,
  restricted: Lock,
};

const zoneLabels = {
  safe: 'Safe Zone',
  exit: 'Exit Zone',
  unauthorized: 'Unauthorized',
  restricted: 'Restricted',
};

export function SafeZoneMonitor({ zones, alerts, className }: SafeZoneMonitorProps) {
  const getZoneAlerts = (zoneId: string) =>
    alerts.filter((a) => a.zoneId === zoneId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('bg-card rounded-xl shadow-card border border-border', className)}
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Safe Zone Monitor</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time zone boundary monitoring
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Zone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Active Alerts</TableHead>
              <TableHead>Last Event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((zone) => {
              const Icon = zoneIcons[zone.zoneType];
              const zoneAlerts = getZoneAlerts(zone.id);
              const unacked = zoneAlerts.filter((a) => !a.acknowledged).length;

              return (
                <TableRow
                  key={zone.id}
                  className={cn(unacked > 0 && 'bg-destructive/5')}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{zone.name}</p>
                        <p className="text-xs text-muted-foreground">{zone.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                        ZONE_COLORS[zone.zoneType]
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {zoneLabels[zone.zoneType]}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {unacked > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold animate-pulse">
                        {unacked}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {zoneAlerts.length > 0 ? (
                      <div className="text-xs">
                        <span className="text-lg mr-1.5">
                          {ID_METHOD_ICONS[zoneAlerts[0].identificationMethod]}
                        </span>
                        <span className="text-muted-foreground">
                          {zoneAlerts[0].patientName} —{' '}
                          {new Date(zoneAlerts[0].timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">No events</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}

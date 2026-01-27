import { motion } from 'framer-motion';
import { Thermometer, Droplets, DoorOpen, DoorClosed, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SensorReading } from '@/types/dashboard';

interface SensorCardProps {
  sensor: SensorReading;
  index: number;
}

const sensorIcons = {
  temperature: Thermometer,
  humidity: Droplets,
  door: DoorOpen,
  motion: AlertTriangle,
  pressure: AlertTriangle,
};

const statusColors = {
  ok: 'border-status-ok bg-status-ok/5',
  alert: 'border-status-alert bg-status-alert/5',
  warning: 'border-status-warning bg-status-warning/5',
};

const statusDotColors = {
  ok: 'bg-status-ok',
  alert: 'bg-status-alert',
  warning: 'bg-status-warning',
};

export function SensorCard({ sensor, index }: SensorCardProps) {
  const Icon = sensorIcons[sensor.type];
  const isDoor = sensor.type === 'door';
  const doorOpen = sensor.value === true;
  
  const displayValue = isDoor 
    ? (doorOpen ? 'OPEN' : 'CLOSED')
    : `${sensor.value}${sensor.unit || ''}`;
  
  const DoorIcon = doorOpen ? DoorOpen : DoorClosed;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'relative rounded-xl border-2 p-5 bg-card shadow-card transition-all duration-300 hover:shadow-card-hover',
        statusColors[sensor.status]
      )}
    >
      {/* Status Indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className={cn(
          'w-2.5 h-2.5 rounded-full',
          statusDotColors[sensor.status],
          sensor.status !== 'ok' && 'animate-pulse-status'
        )} />
        <span className={cn(
          'text-xs font-semibold uppercase tracking-wider',
          sensor.status === 'ok' && 'text-status-ok',
          sensor.status === 'alert' && 'text-status-alert',
          sensor.status === 'warning' && 'text-status-warning'
        )}>
          {sensor.status}
        </span>
      </div>

      {/* Icon */}
      <div className={cn(
        'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
        sensor.status === 'ok' && 'bg-status-ok/10 text-status-ok',
        sensor.status === 'alert' && 'bg-status-alert/10 text-status-alert',
        sensor.status === 'warning' && 'bg-status-warning/10 text-status-warning'
      )}>
        {isDoor ? <DoorIcon className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
      </div>

      {/* Value */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          {sensor.type}
        </p>
        <p className={cn(
          'text-2xl font-bold sensor-value',
          isDoor && (doorOpen ? 'text-status-alert' : 'text-status-ok')
        )}>
          {displayValue}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {sensor.location}
        </p>
      </div>

      {/* Alert badge for problematic sensors */}
      {sensor.status !== 'ok' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'mt-4 px-3 py-1.5 rounded-md text-xs font-medium',
            sensor.status === 'alert' && 'bg-status-alert/10 text-status-alert',
            sensor.status === 'warning' && 'bg-status-warning/10 text-status-warning'
          )}
        >
          {sensor.status === 'alert' ? '⚠ Requires attention' : '! Check recommended'}
        </motion.div>
      )}
    </motion.div>
  );
}

interface SensorGridProps {
  sensors: SensorReading[];
}

export function SensorGrid({ sensors }: SensorGridProps) {
  const temperatureSensors = sensors.filter(s => s.type === 'temperature');
  const humiditySensors = sensors.filter(s => s.type === 'humidity');
  const doorSensors = sensors.filter(s => s.type === 'door');

  return (
    <div className="space-y-6">
      {/* Temperature Section */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Thermometer className="w-4 h-4" />
          Temperature Sensors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {temperatureSensors.map((sensor, i) => (
            <SensorCard key={sensor.id} sensor={sensor} index={i} />
          ))}
        </div>
      </div>

      {/* Humidity Section */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Droplets className="w-4 h-4" />
          Humidity Sensors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {humiditySensors.map((sensor, i) => (
            <SensorCard key={sensor.id} sensor={sensor} index={i} />
          ))}
        </div>
      </div>

      {/* Door Status Section */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <DoorOpen className="w-4 h-4" />
          Door Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doorSensors.map((sensor, i) => (
            <SensorCard key={sensor.id} sensor={sensor} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

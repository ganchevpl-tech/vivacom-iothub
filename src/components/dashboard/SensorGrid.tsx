import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, DoorOpen, DoorClosed, AlertTriangle, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SensorReading } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface SensorCardProps {
  sensor: SensorReading;
  index: number;
  isLive?: boolean;
  isSortable?: boolean;
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

function SortableSensorCard({ sensor, index, isLive }: SensorCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sensor.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn('relative', isDragging && 'opacity-50')}>
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-12 z-10 p-1 rounded bg-muted/80 text-muted-foreground cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <SensorCardInner sensor={sensor} index={index} isLive={isLive} />
    </div>
  );
}

function SensorCardInner({ sensor, index, isLive = false }: SensorCardProps) {
  const Icon = sensorIcons[sensor.type] ?? AlertTriangle;
  const isDoor = sensor.type === 'door';
  const doorOpen = sensor.value === true || sensor.value === 'true' || sensor.value === 1;
  
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
        statusColors[sensor.status],
        isLive && 'ring-2 ring-primary/20'
      )}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className={cn(
          'w-2.5 h-2.5 rounded-full',
          statusDotColors[sensor.status],
          sensor.status !== 'ok' && 'status-pulse'
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

      <div className={cn(
        'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
        sensor.status === 'ok' && 'bg-status-ok/10 text-status-ok',
        sensor.status === 'alert' && 'bg-status-alert/10 text-status-alert',
        sensor.status === 'warning' && 'bg-status-warning/10 text-status-warning'
      )}>
        {isDoor ? <DoorIcon className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{sensor.location}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{sensor.type}</p>
        <p className={cn(
          'text-2xl font-bold sensor-value',
          isDoor && (doorOpen ? 'text-status-alert' : 'text-status-ok')
        )}>
          {displayValue}
        </p>
      </div>

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

// Re-export for backwards compat
export const SensorCard = SensorCardInner;

interface SensorGridProps {
  sensors: SensorReading[];
  isConnected?: boolean;
  isLoading?: boolean;
}

function SensorSkeleton() {
  return (
    <div className="rounded-xl border-2 border-border p-5 bg-card">
      <div className="flex justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <Skeleton className="w-16 h-4" />
      </div>
      <Skeleton className="w-20 h-4 mb-2" />
      <Skeleton className="w-16 h-8 mb-1" />
      <Skeleton className="w-24 h-4" />
    </div>
  );
}

const STORAGE_KEY = 'sensor-card-order';

function loadSensorOrder(): string[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function saveSensorOrder(order: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch {}
}

export function SensorGrid({ sensors, isConnected = false, isLoading = false }: SensorGridProps) {
  const deduped = new Map<string, SensorReading>();
  for (const s of sensors) deduped.set(s.id, s);
  const mergedSensors = Array.from(deduped.values());

  // Maintain custom order from localStorage
  const [customOrder, setCustomOrder] = useState<string[] | null>(() => loadSensorOrder());

  const orderedSensors = (() => {
    if (!customOrder) return mergedSensors;
    const map = new Map(mergedSensors.map(s => [s.id, s]));
    const ordered: SensorReading[] = [];
    for (const id of customOrder) {
      const s = map.get(id);
      if (s) { ordered.push(s); map.delete(id); }
    }
    // Append any new sensors not yet in order
    for (const s of map.values()) ordered.push(s);
    return ordered;
  })();

  const sensorPointer = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const sensorKeyboard = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
  const dndSensors = useSensors(sensorPointer, sensorKeyboard);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = orderedSensors.map(s => s.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    setCustomOrder(newOrder);
    saveSensorOrder(newOrder);
  }, [orderedSensors]);

  const sensorIds = orderedSensors.map(s => s.id);

  return (
    <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sensorIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading && orderedSensors.length === 0 ? (
            <>
              <SensorSkeleton />
              <SensorSkeleton />
              <SensorSkeleton />
            </>
          ) : (
            orderedSensors.map((sensor, i) => (
              <SortableSensorCard key={sensor.id} sensor={sensor} index={i} isLive={isConnected} />
            ))
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Droplets, X, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SensorReading } from '@/types/dashboard';

interface SensorData {
  temperature: number | null;
  humidity: number | null;
  lastUpdated: Date | null;
}

interface Room {
  id: string;
  name: string;
  area: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sensorIds: { temperature: string; humidity: string } | null;
  color: string;
}

interface FloorPlanProps {
  sensors?: SensorReading[];
  isConnected?: boolean;
}

const ROOMS: Room[] = [
  {
    id: 'dnevna',
    name: 'Дневна / Кухня',
    area: '29.11 м²',
    x: 2, y: 8, width: 36, height: 55,
    sensorIds: {
      temperature: 'sensors_for_temp_temperature',
      humidity: 'sensors_for_temp_humidity',
    },
    color: 'hsl(210 100% 50%)',
  },
  {
    id: 'spalnia_plami',
    name: 'Спалня Плами',
    area: '12.45 м²',
    x: 40, y: 45, width: 24, height: 28,
    sensorIds: {
      temperature: 'senzor_za_temperatura_plami_temperature',
      humidity: 'senzor_za_temperatura_plami_humidity',
    },
    color: 'hsl(24 100% 50%)',
  },
  {
    id: 'spalnia_golqma',
    name: 'Спалня',
    area: '19.21 м²',
    x: 66, y: 8, width: 32, height: 55,
    sensorIds: {
      temperature: 'sonoff_snzb_02d_temperature',
      humidity: 'sonoff_snzb_02d_humidity',
    },
    color: 'hsl(142 76% 36%)',
  },
  {
    id: 'banya1',
    name: 'Баня 1',
    area: '3.34 м²',
    x: 40, y: 8, width: 12, height: 18,
    sensorIds: null,
    color: 'hsl(220 15% 50%)',
  },
  {
    id: 'banya2',
    name: 'Баня 2',
    area: '',
    x: 53, y: 8, width: 12, height: 18,
    sensorIds: null,
    color: 'hsl(220 15% 50%)',
  },
  {
    id: 'antre',
    name: 'Антре',
    area: '',
    x: 40, y: 74, width: 24, height: 10,
    sensorIds: null,
    color: 'hsl(220 15% 45%)',
  },
  {
    id: 'lojia',
    name: 'Лоджия',
    area: '4.13 м²',
    x: 2, y: 65, width: 14, height: 12,
    sensorIds: null,
    color: 'hsl(220 15% 40%)',
  },
];

function getTempColor(temp: number | null): string {
  if (temp === null) return 'hsl(220 15% 40%)';
  if (temp < 16) return 'hsl(210 100% 50%)';
  if (temp < 19) return 'hsl(190 80% 45%)';
  if (temp < 22) return 'hsl(142 76% 36%)';
  if (temp < 25) return 'hsl(38 92% 50%)';
  return 'hsl(0 84% 60%)';
}

function getTempLabel(temp: number | null): string {
  if (temp === null) return '—';
  if (temp < 16) return 'Студено';
  if (temp < 19) return 'Хладно';
  if (temp < 22) return 'Комфортно';
  if (temp < 25) return 'Топло';
  return 'Горещо';
}

function RoomTooltip({ room, sensorData, onClose }: {
  room: Room;
  sensorData: SensorData;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute z-50 bg-card border border-border rounded-xl shadow-lg p-4 min-w-[220px]"
      style={{
        left: `${room.x + room.width / 2}%`,
        top: `${room.y > 50 ? room.y - 5 : room.y + room.height + 2}%`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{room.name}</h4>
          {room.area && <p className="text-xs text-muted-foreground">{room.area}</p>}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {room.sensorIds ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Thermometer className="w-3.5 h-3.5" />
              Температура
            </span>
            <span className="text-sm font-semibold text-foreground">
              {sensorData.temperature !== null ? `${sensorData.temperature}°C` : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Droplets className="w-3.5 h-3.5" />
              Влажност
            </span>
            <span className="text-sm font-semibold text-foreground">
              {sensorData.humidity !== null ? `${sensorData.humidity}%` : '—'}
            </span>
          </div>

          {sensorData.temperature !== null && (
            <div className="mt-1 px-2 py-1 rounded text-xs font-medium text-center"
              style={{ backgroundColor: `${getTempColor(sensorData.temperature)}33`, color: getTempColor(sensorData.temperature) }}
            >
              {getTempLabel(sensorData.temperature)}
            </div>
          )}
          {sensorData.lastUpdated && (
            <p className="text-[10px] text-muted-foreground text-center">
              {sensorData.lastUpdated.toLocaleTimeString('bg-BG', { timeZone: 'Europe/Sofia' })}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Няма сензор</p>
      )}
    </motion.div>
  );
}

export function FloorPlan({ sensors = [], isConnected = false }: FloorPlanProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'temperature' | 'humidity'>('temperature');

  // Build a lookup map from sensor id to value
  const sensorMap: Record<string, number> = {};
  sensors.forEach(s => {
    if (typeof s.value === 'number') {
      sensorMap[s.id] = s.value;
    }
  });

  console.log('FloorPlan sensor IDs:', sensors.slice(0, 5).map(s => ({ id: s.id, type: s.type, value: s.value })));
  console.log('FloorPlan sensorMap keys:', Object.keys(sensorMap));

  const getSensorData = (room: Room): SensorData => {
    if (!room.sensorIds) return { temperature: null, humidity: null, lastUpdated: null };
    return {
      temperature: sensorMap[room.sensorIds.temperature] ?? null,
      humidity: sensorMap[room.sensorIds.humidity] ?? null,
      lastUpdated: sensors.length > 0 ? new Date() : null,
    };
  };

  const getRoomFill = (room: Room): string => {
    const data = getSensorData(room);
    if (!room.sensorIds) return 'hsl(220 15% 20% / 0.4)';
    if (viewMode === 'temperature') {
      const color = getTempColor(data.temperature);
      return color.replace(')', ' / 0.25)').replace('hsl(', 'hsl(');
    } else {
      if (data.humidity === null) return 'hsl(220 15% 20% / 0.4)';
      const h = data.humidity;
      if (h < 30) return 'hsl(38 92% 50% / 0.25)';
      if (h < 60) return 'hsl(142 76% 36% / 0.25)';
      return 'hsl(210 100% 50% / 0.25)';
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Floor Plan</h2>
          <p className="text-sm text-muted-foreground">Живи данни от сензорите</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('temperature')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'temperature' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Thermometer className="w-3.5 h-3.5" />
              Темп.
            </button>
            <button
              onClick={() => setViewMode('humidity')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'humidity' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Droplets className="w-3.5 h-3.5" />
              Влажн.
            </button>
          </div>
          <div className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            isConnected ? 'text-status-ok' : 'text-status-alert'
          )}>
            {isConnected ? <><Wifi className="w-3.5 h-3.5" /> Live</> : <><WifiOff className="w-3.5 h-3.5" /> Офлайн</>}
          </div>
        </div>
      </div>

      {/* Floor Plan SVG */}
      <div className="relative p-4">
        <svg viewBox="0 0 100 90" className="w-full h-auto" style={{ minHeight: 300 }}>
          <defs>
            <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="hsl(220 15% 30%)" strokeWidth="0.1" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="90" fill="url(#grid)" rx="2" />

          {ROOMS.map((room) => {
            const data = getSensorData(room);
            const isSelected = selectedRoom === room.id;
            const fill = getRoomFill(room);
            const tempColor = getTempColor(data.temperature);

            return (
              <g key={room.id}>
                <rect
                  x={room.x} y={room.y}
                  width={room.width} height={room.height}
                  fill={fill}
                  stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(220 15% 40%)'}
                  strokeWidth={isSelected ? 0.8 : 0.4}
                  rx={1}
                  className="cursor-pointer transition-all hover:opacity-80"
                  onClick={() => setSelectedRoom(isSelected ? null : room.id)}
                />
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2 - (room.sensorIds ? 3 : 0)}
                  textAnchor="middle"
                  className="fill-foreground text-[2.5px] font-medium pointer-events-none select-none"
                >
                  {room.name}
                </text>
                {room.sensorIds && (
                  <>
                    {data.temperature !== null && (
                      <text
                        x={room.x + room.width / 2}
                        y={room.y + room.height / 2 + 2}
                        textAnchor="middle"
                        className="text-[3px] font-bold pointer-events-none select-none"
                        fill={tempColor}
                      >
                        {data.temperature}°C
                      </text>
                    )}
                    {data.humidity !== null && (
                      <text
                        x={room.x + room.width / 2}
                        y={room.y + room.height / 2 + 6}
                        textAnchor="middle"
                        className="text-[2.2px] pointer-events-none select-none"
                        fill="hsl(210 100% 60%)"
                      >
                        {data.humidity}%
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>

        <AnimatePresence>
          {selectedRoom && (() => {
            const room = ROOMS.find(r => r.id === selectedRoom);
            if (!room) return null;
            return (
              <RoomTooltip
                key={room.id}
                room={room}
                sensorData={getSensorData(room)}
                onClose={() => setSelectedRoom(null)}
              />
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-4 pb-4 text-[11px] text-muted-foreground">
        {viewMode === 'temperature' ? (
          [
            { label: '< 16°C Студено', color: 'hsl(210 100% 50%)' },
            { label: '16-19°C Хладно', color: 'hsl(190 80% 45%)' },
            { label: '19-22°C Комфорт', color: 'hsl(142 76% 36%)' },
            { label: '22-25°C Топло', color: 'hsl(38 92% 50%)' },
            { label: '> 25°C Горещо', color: 'hsl(0 84% 60%)' },
          ].map(item => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))
        ) : (
          [
            { label: '< 30% Сухо', color: 'hsl(38 92% 50%)' },
            { label: '30-60% Нормално', color: 'hsl(142 76% 36%)' },
            { label: '> 60% Влажно', color: 'hsl(210 100% 50%)' },
          ].map(item => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

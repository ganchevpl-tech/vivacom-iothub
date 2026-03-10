import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SensorReading } from '@/types/dashboard';

interface FlespiTelemetry {
  temperature?: number;
  humidity?: number;
  'viva/home/temperature'?: number;
  'viva/home/humidity'?: number;
  door?: boolean;
  [key: string]: unknown;
}

interface UseFlespiDataReturn {
  sensors: SensorReading[];
  isConnected: boolean;
  lastUpdated: Date | null;
  error: string | null;
  refetch: () => Promise<void>;
}

const POLLING_INTERVAL = 60000; // 60 seconds

export function useFlespiData(): UseFlespiDataReturn {
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseTemperature = (data: FlespiTelemetry): number | null => {
    // Check for viva/home/temperature first, then generic temperature
    const temp = data['viva/home/temperature'] ?? data.temperature;
    if (typeof temp === 'number') return temp;
    return null;
  };

  const parseHumidity = (data: FlespiTelemetry): number | null => {
    // Check for viva/home/humidity first, then generic humidity
    const hum = data['viva/home/humidity'] ?? data.humidity;
    if (typeof hum === 'number') return hum;
    return null;
  };

  const getTemperatureStatus = (value: number): 'ok' | 'warning' | 'alert' => {
    if (value > 28) return 'alert';
    if (value > 25) return 'warning';
    if (value < 15) return 'warning';
    return 'ok';
  };

  const getHumidityStatus = (value: number): 'ok' | 'warning' | 'alert' => {
    if (value > 70) return 'warning';
    if (value > 80) return 'alert';
    if (value < 30) return 'warning';
    return 'ok';
  };

  const fetchTelemetry = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('flespi-telemetry');

      if (fnError) {
        console.error('Flespi function error:', fnError);
        setError(fnError.message);
        setIsConnected(false);
        return;
      }

      console.log('Flespi raw response:', data);

      if (!data?.success) {
        console.error('Flespi API error:', data?.error);
        setError(data?.error || 'Failed to fetch data');
        setIsConnected(false);
        return;
      }

      if (data.success && data.data) {
        const rawData = data.data;
        const messages: any[] = Array.isArray(rawData.result) ? rawData.result : [];
        
        // Deduplicate: keep only the last message per unique ident
        const latestByIdent = new Map<string, any>();
        for (const msg of messages) {
          if (msg.ident) {
            latestByIdent.set(msg.ident, msg);
          }
        }

        const timestamp = new Date().toISOString();
        const mapped: SensorReading[] = [];

        const LOCATION_LABELS: Record<string, string> = {
          'sensors_for_temp': 'Дневна',
          'senzor_za_temperatura_plami': 'Спалня Плами',
          'sonoff_snzb_02d': 'Спалня',
        };

        for (const [ident, msg] of latestByIdent) {
          const baseName = ident.replace(/_(temperature|humidity)$/, '');
          const location = LOCATION_LABELS[baseName] || baseName.replace(/_/g, ' ');
          
          // Temperature sensor
          if (msg.value !== undefined && msg.value !== null && ident.endsWith('_temperature')) {
            mapped.push({
              id: `${baseName}_temp`,
              deviceId: `flespi-${baseName}`,
              type: 'temperature' as const,
              value: msg.value,
              unit: '°C',
              location,
              status: getTemperatureStatus(msg.value),
              timestamp,
            });
          }
          
          // Humidity sensor
          if (msg.value !== undefined && msg.value !== null && ident.endsWith('_humidity')) {
            mapped.push({
              id: `${baseName}_hum`,
              deviceId: `flespi-${baseName}`,
              type: 'humidity' as const,
              value: msg.value,
              unit: '%',
              location,
              status: getHumidityStatus(msg.value),
              timestamp,
            });
          }
        }

        console.log('Mapped sensors:', mapped);
        
        if (mapped.length > 0) {
          setSensors(mapped);
        }
        setIsConnected(true);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setIsConnected(true);
        setLastUpdated(new Date());
        setError(null);
      }

    } catch (err) {
      console.error('Error fetching Flespi data:', err);
      setError(err instanceof Error ? err.message : 'Connection error');
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchTelemetry();

    // Set up polling interval
    const intervalId = setInterval(fetchTelemetry, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchTelemetry]);

  return {
    sensors,
    isConnected,
    lastUpdated,
    error,
    refetch: fetchTelemetry,
  };
}

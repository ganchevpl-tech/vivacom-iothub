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
        const sensorArray = Array.isArray(rawData.result) 
          ? rawData.result 
          : Object.entries(rawData).map(([ident, values]: [string, any]) => ({
              ident,
              ...values
            }));
        
        const timestamp = new Date().toISOString();
        const mapped: SensorReading[] = sensorArray.map((item: any, i: number) => ({
          id: item.ident || `sensor-${i}`,
          deviceId: `flespi-${item.ident || i}`,
          type: item.temperature !== undefined ? 'temperature' as const : 'humidity' as const,
          value: item.temperature ?? item.humidity ?? item.value ?? 0,
          unit: item.temperature !== undefined ? '°C' : '%',
          location: item.ident || `Sensor ${i}`,
          status: item.temperature !== undefined 
            ? getTemperatureStatus(item.temperature) 
            : item.humidity !== undefined 
              ? getHumidityStatus(item.humidity) 
              : 'ok' as const,
          timestamp,
        }));
        
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

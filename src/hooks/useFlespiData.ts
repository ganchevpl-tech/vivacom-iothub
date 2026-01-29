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

const POLLING_INTERVAL = 5000; // 5 seconds

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

      if (!data?.success) {
        console.error('Flespi API error:', data?.error);
        setError(data?.error || 'Failed to fetch data');
        setIsConnected(false);
        return;
      }

      // Parse the response data
      const telemetryData = data.data;
      const newSensors: SensorReading[] = [];
      const timestamp = new Date().toISOString();

      // Handle different response structures
      let rawMessages: FlespiTelemetry[] = [];
      
      if (data.source === 'messages' && telemetryData?.result) {
        rawMessages = telemetryData.result;
      } else if (data.source === 'devices' && telemetryData?.result) {
        // Device telemetry format
        rawMessages = Object.values(telemetryData.result).flat() as FlespiTelemetry[];
      } else if (Array.isArray(telemetryData)) {
        rawMessages = telemetryData;
      }

      // Process messages to extract sensor readings
      const processedTemps = new Set<string>();
      const processedHums = new Set<string>();

      for (const msg of rawMessages) {
        const temp = parseTemperature(msg);
        const hum = parseHumidity(msg);
        const location = (msg.ident as string) || (msg.device_name as string) || 'Flespi Device';

        if (temp !== null && !processedTemps.has(location)) {
          processedTemps.add(location);
          newSensors.push({
            id: `flespi-temp-${location}`,
            deviceId: `flespi-${location}`,
            type: 'temperature',
            value: Math.round(temp * 10) / 10,
            unit: '°C',
            status: getTemperatureStatus(temp),
            timestamp,
            location,
          });
        }

        if (hum !== null && !processedHums.has(location)) {
          processedHums.add(location);
          newSensors.push({
            id: `flespi-hum-${location}`,
            deviceId: `flespi-${location}`,
            type: 'humidity',
            value: Math.round(hum),
            unit: '%',
            status: getHumidityStatus(hum),
            timestamp,
            location,
          });
        }
      }

      // If we got data, update state
      if (newSensors.length > 0) {
        setSensors(newSensors);
        setIsConnected(true);
        setLastUpdated(new Date());
        setError(null);
      } else {
        // No sensor data found, but connection is OK
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

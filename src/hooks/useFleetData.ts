import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Vehicle } from '@/types/fleet';

interface UseFleetDataReturn {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refetch: () => void;
}

const POLL_INTERVAL_MS = 60_000;

export function useFleetData(): UseFleetDataReturn {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('flespi-telemetry', {
        body: null,
        method: 'GET',
        // Pass query param via headers since invoke doesn't support query in all SDK versions
      });

      // Fallback: direct fetch with query param
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/flespi-telemetry?type=fleet`;
      const res = await fetch(url, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch fleet data');
      }

      const mapped: Vehicle[] = (json.vehicles ?? []).map((v: any) => ({
        ...v,
        lastUpdate: v.lastUpdate ? new Date(v.lastUpdate) : new Date(),
      }));

      setVehicles(mapped);
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      console.error('[useFleetData]', msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  return { vehicles, isLoading, error, lastUpdate, refetch: fetchData };
}

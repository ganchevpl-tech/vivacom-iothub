import { useEffect, useMemo, useState } from 'react';
import { NightWanderingEvent } from '@/types/safety';
import { mockNightWandering } from '@/data/safetyMockData';

const NIGHT_START = 0; // 00:00
const NIGHT_END = 5; // 05:00

function isNightHourSofia(date: Date): boolean {
  // Use Europe/Sofia hour explicitly
  const hourStr = new Intl.DateTimeFormat('bg-BG', {
    hour: '2-digit',
    hour12: false,
    timeZone: 'Europe/Sofia',
  }).format(date);
  const hour = Number(hourStr);
  return hour >= NIGHT_START && hour < NIGHT_END;
}

export interface NightWanderingHook {
  events: NightWanderingEvent[];
  isNightWindow: boolean;
  activeCount: number;
}

export function useNightWandering(extraEvents: NightWanderingEvent[] = []): NightWanderingHook {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const all = [...mockNightWandering, ...extraEvents];
    const filtered = all.filter((e) => isNightHourSofia(new Date(e.detectedAt)));
    return {
      events: filtered.sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt)),
      isNightWindow: isNightHourSofia(now),
      activeCount: filtered.filter((e) => !e.resolved).length,
    };
  }, [now, extraEvents]);
}

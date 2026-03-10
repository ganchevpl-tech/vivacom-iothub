import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export const DEFAULT_LAYOUT: WidgetLayout[] = [
  { i: 'stats',         x: 0,  y: 0,  w: 12, h: 3,  minW: 6,  minH: 3 },
  { i: 'sensors',       x: 0,  y: 3,  w: 8,  h: 8,  minW: 4,  minH: 4 },
  { i: 'access',        x: 8,  y: 3,  w: 4,  h: 8,  minW: 3,  minH: 4 },
  { i: 'floorplan',     x: 0,  y: 11, w: 8,  h: 7,  minW: 4,  minH: 4 },
  { i: 'logs',          x: 0,  y: 18, w: 12, h: 7,  minW: 6,  minH: 4 },
];

export const WIDGET_LABELS: Record<string, string> = {
  stats: 'Статистики',
  sensors: 'Сензори (Live)',
  access: 'Контрол на достъпа',
  floorplan: 'Етажен план',
  logs: 'Логове',
};

interface UseDashboardLayoutReturn {
  layout: WidgetLayout[];
  isEditing: boolean;
  isSaving: boolean;
  setIsEditing: (v: boolean) => void;
  onLayoutChange: (newLayout: WidgetLayout[]) => void;
  resetLayout: () => void;
}

export function useDashboardLayout(): UseDashboardLayoutReturn {
  const [layout, setLayout] = useState<WidgetLayout[]>(DEFAULT_LAYOUT);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadLayout();
  }, []);

  const loadLayout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('user_dashboard_layouts')
        .select('layout_data')
        .eq('user_id', user.id)
        .single();

      if (data && !error && Array.isArray(data.layout_data) && data.layout_data.length > 0) {
        setLayout(data.layout_data as WidgetLayout[]);
      }
    } catch (err) {
      console.error('Failed to load dashboard layout:', err);
    }
  };

  const saveLayout = useCallback(async (newLayout: WidgetLayout[]) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from('user_dashboard_layouts')
        .upsert({
          user_id: user.id,
          layout_data: newLayout,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save layout:', err);
      toast.error('Грешка при запазване на оформлението');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const onLayoutChange = useCallback((newLayout: WidgetLayout[]) => {
    // Merge minW/minH from defaults since react-grid-layout strips them
    const merged = newLayout.map(item => {
      const def = DEFAULT_LAYOUT.find(d => d.i === item.i);
      return {
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: def?.minW ?? item.minW,
        minH: def?.minH ?? item.minH,
      };
    });
    setLayout(merged);
    saveLayout(merged);
  }, [saveLayout]);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    saveLayout(DEFAULT_LAYOUT);
    toast.success('Оформлението е нулирано');
  }, [saveLayout]);

  return { layout, isEditing, isSaving, setIsEditing, onLayoutChange, resetLayout };
}

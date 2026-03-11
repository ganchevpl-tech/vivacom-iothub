import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const DEFAULT_WIDGET_ORDER = ['stats', 'sensors', 'access', 'floorplan', 'google_maps', 'logs'];

export const WIDGET_LABELS: Record<string, string> = {
  stats: 'Статистики',
  sensors: 'Сензори (Live)',
  access: 'Контрол на достъпа',
  floorplan: 'Етажен план',
  google_maps: 'Google Maps',
  logs: 'Логове',
};

interface UseDashboardLayoutReturn {
  widgetOrder: string[];
  isEditing: boolean;
  isSaving: boolean;
  setIsEditing: (v: boolean) => void;
  setWidgetOrder: (order: string[]) => void;
  saveOrder: (order: string[]) => void;
  resetLayout: () => void;
}

export function useDashboardLayout(): UseDashboardLayoutReturn {
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_WIDGET_ORDER);
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

      if (data && !error) {
        const stored = data.layout_data;
        // Support both old format (array of objects with .i) and new format (array of strings)
        if (Array.isArray(stored) && stored.length > 0) {
          if (typeof stored[0] === 'string') {
            setWidgetOrder(stored as string[]);
          } else if (stored[0]?.i) {
            setWidgetOrder(stored.map((item: any) => item.i));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard layout:', err);
    }
  };

  const saveOrder = useCallback(async (order: string[]) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from('user_dashboard_layouts')
        .upsert({
          user_id: user.id,
          layout_data: order,
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

  const resetLayout = useCallback(() => {
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
    saveOrder(DEFAULT_WIDGET_ORDER);
    toast.success('Оформлението е нулирано');
  }, [saveOrder]);

  return { widgetOrder, isEditing, isSaving, setIsEditing, setWidgetOrder, saveOrder, resetLayout };
}

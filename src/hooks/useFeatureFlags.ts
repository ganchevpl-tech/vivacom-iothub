import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Feature =
  | 'basic_sensors'
  | 'log_viewer'
  | 'hr_attendance'
  | 'export_csv'
  | 'email_notifications'
  | 'patient_safety'
  | 'geofencing'
  | 'panic_alerts'
  | 'night_wandering'
  | 'visitor_management'
  | 'account_management'
  | 'sub_accounts'
  | 'api_access'
  | 'custom_reports';

export const FEATURE_LABELS: Record<Feature, string> = {
  basic_sensors:       'Основни сензори',
  log_viewer:          'Лог мениджър',
  hr_attendance:       'Следене на работно време',
  export_csv:          'Експорт CSV',
  email_notifications: 'Email известия',
  patient_safety:      'Безопасност на пациенти',
  geofencing:          'Геофенсинг',
  panic_alerts:        'Паник аларми',
  night_wandering:     'Нощно проследяване',
  visitor_management:  'Управление на посетители',
  account_management:  'Управление на акаунти',
  sub_accounts:        'Под-акаунти',
  api_access:          'API достъп',
  custom_reports:      'Персонализирани отчети',
};

export const DEFAULT_FEATURES: Feature[] = [
  'basic_sensors',
  'log_viewer',
];

interface UseFeatureFlagsReturn {
  features: Record<Feature, boolean>;
  isLoading: boolean;
  error: Error | null;
  hasFeature: (feature: Feature) => boolean;
}

export function useFeatureFlags(organizationId?: string): UseFeatureFlagsReturn {
  const [features, setFeatures] = useState<Record<Feature, boolean>>(() => {
    const defaults = {} as Record<Feature, boolean>;
    (Object.keys(FEATURE_LABELS) as Feature[]).forEach(f => {
      defaults[f] = DEFAULT_FEATURES.includes(f);
    });
    return defaults;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    async function fetchFeatures() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: sbError } = await (supabase as any)
          .from('organization_features')
          .select('feature, enabled')
          .eq('organization_id', organizationId);

        if (sbError) throw new Error(sbError.message);

        if (data && data.length > 0) {
          const updated = {} as Record<Feature, boolean>;
          (Object.keys(FEATURE_LABELS) as Feature[]).forEach(f => {
            updated[f] = DEFAULT_FEATURES.includes(f);
          });
          data.forEach((row: any) => {
            if (row.feature in updated) {
              updated[row.feature as Feature] = row.enabled;
            }
          });
          setFeatures(updated);
        }
      } catch (err) {
        console.error('[useFeatureFlags] Failed to fetch features:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch features'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeatures();

    const channel = supabase
      .channel(`features:${organizationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'organization_features',
        filter: `organization_id=eq.${organizationId}`,
      }, (payload: any) => {
        if (payload.new?.feature) {
          setFeatures(prev => ({
            ...prev,
            [payload.new.feature]: payload.new.enabled,
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  const hasFeature = (feature: Feature): boolean => features[feature] ?? false;

  return { features, isLoading, error, hasFeature };
}

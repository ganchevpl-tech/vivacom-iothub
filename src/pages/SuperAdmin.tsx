import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/providers/AuthProvider';
import { ImpersonateDialog } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Building2, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';
import { AdminMfaGate } from '@/components/security/AdminMfaGate';

const FEATURES = [
  { key: 'basic_sensors', label: 'Основни сензори' },
  { key: 'floor_plan', label: 'Floor Plan' },
  { key: 'google_maps', label: 'Google Maps' },
  { key: 'fleet_management', label: 'Fleet Management' },
  { key: 'hr_attendance', label: 'HR Присъствие' },
  { key: 'patient_safety', label: 'Patient Safety' },
  { key: 'log_viewer', label: 'Лог Преглед' },
  { key: 'api_access', label: 'API Достъп' },
];

export default function SuperAdmin() {
  const { profile, isSuperAdmin } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [features, setFeatures] = useState<Record<string, Record<string, boolean>>>({});
  const [impersonateOrg, setImpersonateOrg] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'organizations' | 'features' | 'users'>('organizations');

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    const { data } = await (supabase as any)
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOrganizations(data);

    const { data: featureData } = await (supabase as any)
      .from('organization_features')
      .select('*');
    if (featureData) {
      const map: Record<string, Record<string, boolean>> = {};
      for (const row of featureData) {
        if (!map[row.organization_id]) map[row.organization_id] = {};
        map[row.organization_id][row.feature_key] = row.is_enabled;
      }
      setFeatures(map);
    }
  }

  async function toggleFeature(orgId: string, featureKey: string, current: boolean) {
    await (supabase as any)
      .from('organization_features')
      .upsert({ organization_id: orgId, feature_key: featureKey, is_enabled: !current },
        { onConflict: 'organization_id,feature_key' });
    setFeatures(prev => ({
      ...prev,
      [orgId]: { ...(prev[orgId] || {}), [featureKey]: !current }
    }));
  }

  return (
    <DashboardLayout title="Super Admin" subtitle="Управление на платформата">
      <AdminMfaGate>
      <div className="space-y-6">

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          {(['organizations', 'features', 'users'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'organizations' ? '🏢 Организации' :
               tab === 'features' ? '⚙️ Feature Flags' : '👤 Потребители'}
            </button>
          ))}
        </div>

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-muted-foreground">Организация</th>
                  <th className="text-left p-4 text-muted-foreground">Email</th>
                  <th className="text-left p-4 text-muted-foreground">Създадена</th>
                  <th className="text-left p-4 text-muted-foreground">Действия</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => (
                  <tr key={org.id} className="border-t border-border hover:bg-muted/20">
                    <td className="p-4 font-medium">{org.name}</td>
                    <td className="p-4 text-muted-foreground">{org.contact_email}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString('bg-BG')}
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setImpersonateOrg(org)}
                        className="gap-2"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Влез като клиент
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            {organizations.map(org => (
              <div key={org.id} className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {org.name}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {FEATURES.map(feature => {
                    const enabled = features[org.id]?.[feature.key] ?? false;
                    return (
                      <button
                        key={feature.key}
                        onClick={() => toggleFeature(org.id, feature.key, enabled)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          enabled
                            ? 'border-status-ok bg-status-ok/10 text-status-ok'
                            : 'border-border bg-muted/20 text-muted-foreground'
                        }`}
                      >
                        <span className="text-xs font-medium">{feature.label}</span>
                        {enabled
                          ? <ToggleRight className="w-4 h-4" />
                          : <ToggleLeft className="w-4 h-4" />
                        }
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-card rounded-xl border border-border p-6">
            <p className="text-muted-foreground text-sm">Управление на потребители — очаква се скоро.</p>
          </div>
        )}

      </div>

      {/* Impersonate Dialog */}
      {impersonateOrg && (
        <ImpersonateDialog
          organization={impersonateOrg}
          onClose={() => setImpersonateOrg(null)}
        />
      )}
    </DashboardLayout>
  );
}

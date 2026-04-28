import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LogOut, Eye, TriangleAlert as AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logAuthEvent } from '@/lib/authAudit';

export type UserRole = 'super_admin' | 'admin' | 'hr_manager' | 'medical_staff' | 'security' | 'viewer';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  hr_manager: 60,
  medical_staff: 60,
  security: 60,
  viewer: 20,
};

export interface Organization {
  id: string;
  name: string;
  contact_email: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  /** Highest-tier role (derived from user_roles table). DO NOT mutate this. */
  role: UserRole;
  organization_id: string | null;
  organization?: Organization;
  mfa_enabled?: boolean;
  last_sign_in_at?: string | null;
}

export interface ImpersonationSession {
  superAdminId: string;
  superAdminEmail: string;
  targetOrganizationId: string;
  targetOrganizationName: string;
  startedAt: Date;
  reason: string;
}

interface AuthContextValue {
  profile: UserProfile | null;
  /** All roles assigned to the current user (Zero Trust: never trust a single role). */
  roles: UserRole[];
  /** Whether the current session has passed MFA (AAL2). */
  aalLevel: 'aal1' | 'aal2' | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  hasRole: (role: UserRole) => boolean;
  hasMinRole: (role: UserRole) => boolean;
  impersonation: ImpersonationSession | null;
  isImpersonating: boolean;
  startImpersonation: (org: Organization, reason: string) => Promise<void>;
  stopImpersonation: () => void;
  currentOrganizationId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function computeHighestRole(roles: UserRole[]): UserRole {
  if (roles.length === 0) return 'viewer';
  return roles.reduce((highest, r) =>
    ROLE_HIERARCHY[r] > ROLE_HIERARCHY[highest] ? r : highest
  , 'viewer' as UserRole);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [aalLevel, setAalLevel] = useState<'aal1' | 'aal2' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonation, setImpersonation] = useState<ImpersonationSession | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setRoles([]);
        setAalLevel(null);
        return;
      }

      // Load profile + roles in parallel (Zero Trust: separate concerns)
      const [profileRes, rolesRes, aalRes] = await Promise.all([
        (supabase as any)
          .from('profiles')
          .select(`
            id, email, full_name, organization_id, mfa_enabled, last_sign_in_at,
            organization:organizations(id, name, contact_email, created_at)
          `)
          .eq('id', user.id)
          .maybeSingle(),
        (supabase as any)
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const userRoles = (rolesRes.data ?? []).map((r: { role: UserRole }) => r.role);
      const highest = computeHighestRole(userRoles);

      setRoles(userRoles);
      setProfile(profileRes.data ? { ...profileRes.data, role: highest } : null);
      setAalLevel(aalRes.data?.currentLevel as 'aal1' | 'aal2' | null);
    } catch (err) {
      console.error('[AuthProvider] Failed to load profile:', err);
      setProfile(null);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Order matters: subscribe FIRST, then check session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Defer to next tick to avoid deadlocks per Supabase docs
      setTimeout(() => {
        loadProfile();
      }, 0);

      // Server-side audit (fire-and-forget)
      if (event === 'SIGNED_IN') logAuthEvent('login_success');
      if (event === 'SIGNED_OUT') logAuthEvent('logout');
      if (event === 'PASSWORD_RECOVERY') logAuthEvent('password_reset_requested');
      if (event === 'USER_UPDATED') logAuthEvent('password_changed');
      if (event === 'MFA_CHALLENGE_VERIFIED') logAuthEvent('mfa_challenge_success');
    });

    loadProfile();
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const isSuperAdmin = roles.includes('super_admin');
  const isAdmin = isSuperAdmin || roles.includes('admin');

  const hasRole = useCallback((role: UserRole) => roles.includes(role), [roles]);
  const hasMinRole = useCallback((role: UserRole) => {
    if (roles.length === 0) return false;
    const userMax = Math.max(...roles.map((r) => ROLE_HIERARCHY[r]));
    return userMax >= ROLE_HIERARCHY[role];
  }, [roles]);

  const startImpersonation = async (org: Organization, reason: string) => {
    if (!isSuperAdmin || !profile) return;
    if (!reason.trim() || reason.trim().length < 10) {
      console.warn('[AuthProvider] Impersonation requires a reason >= 10 chars');
      return;
    }

    await (supabase as any).from('super_admin_audit_log').insert({
      super_admin_id: profile.id,
      super_admin_email: profile.email,
      action: 'impersonation_start',
      target_organization_id: org.id,
      target_organization_name: org.name,
      reason: reason.trim().slice(0, 500),
      timestamp: new Date().toISOString(),
    });

    setImpersonation({
      superAdminId: profile.id,
      superAdminEmail: profile.email,
      targetOrganizationId: org.id,
      targetOrganizationName: org.name,
      startedAt: new Date(),
      reason,
    });
  };

  const stopImpersonation = async () => {
    if (!impersonation || !profile) return;

    await (supabase as any).from('super_admin_audit_log').insert({
      super_admin_id: profile.id,
      super_admin_email: profile.email,
      action: 'impersonation_end',
      target_organization_id: impersonation.targetOrganizationId,
      target_organization_name: impersonation.targetOrganizationName,
      reason: `Session ended. Duration: ${Math.round((Date.now() - impersonation.startedAt.getTime()) / 1000)}s`,
      timestamp: new Date().toISOString(),
    });

    setImpersonation(null);
  };

  const signOut = useCallback(async () => {
    setImpersonation(null);
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
    setAalLevel(null);
  }, []);

  const currentOrganizationId = impersonation
    ? impersonation.targetOrganizationId
    : profile?.organization_id ?? null;

  return (
    <AuthContext.Provider value={{
      profile,
      roles,
      aalLevel,
      isLoading,
      isSuperAdmin,
      isAdmin,
      hasRole,
      hasMinRole,
      impersonation,
      isImpersonating: !!impersonation,
      startImpersonation,
      stopImpersonation,
      currentOrganizationId,
      signOut,
    }}>
      {children}
      <ImpersonationBanner />
    </AuthContext.Provider>
  );
}

function ImpersonationBanner() {
  const { impersonation, stopImpersonation } = useAuth();

  return (
    <AnimatePresence>
      {impersonation && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-status-alert text-white px-4 py-2 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Eye className="w-4 h-4" />
            Режим на преглед:
            <span className="font-bold">{impersonation.targetOrganizationName}</span>
            <span className="opacity-70">
              · Влязъл в {impersonation.startedAt.toLocaleTimeString('bg-BG', { timeZone: 'Europe/Sofia' })}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={stopImpersonation}
            className="border-white/30 text-white hover:bg-white/10 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Излез от прегледа
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ImpersonateDialog({ organization, onClose }: { organization: Organization; onClose: () => void }) {
  const { startImpersonation } = useAuth();
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (reason.trim().length < 10) return;
    setIsLoading(true);
    await startImpersonation(organization, reason.trim());
    setIsLoading(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-xl border border-border shadow-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-status-alert/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-status-alert" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Влез като клиент</h3>
            <p className="text-sm text-muted-foreground">{organization.name}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Всички действия се записват в одит лога. Въведи причина (мин. 10 символа).
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 500))}
          placeholder="Причина: напр. 'Клиентът съобщи за грешка в HR модула'"
          className="w-full rounded-lg border border-border bg-muted/30 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring mb-4"
          rows={3}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Отказ</Button>
          <Button
            onClick={handleStart}
            disabled={reason.trim().length < 10 || isLoading}
            className="flex-1 bg-status-alert hover:bg-status-alert/90 text-white gap-2"
          >
            <Shield className="w-4 h-4" />
            {isLoading ? 'Влизане...' : 'Влез'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function RoleGate({ requiredRole, children, fallback }: { requiredRole: UserRole; children: ReactNode; fallback?: ReactNode }) {
  const { hasMinRole, isLoading } = useAuth();

  if (isLoading) return <div className="animate-pulse rounded-xl bg-muted/30 w-full h-32" />;
  if (!hasMinRole(requiredRole)) return fallback ? <>{fallback}</> : null;

  return <>{children}</>;
}

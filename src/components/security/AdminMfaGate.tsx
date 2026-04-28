import { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

interface AdminMfaGateProps {
  children: ReactNode;
  /** If true, also requires the current session to be MFA-verified (AAL2). */
  requireAal2?: boolean;
}

/**
 * Zero Trust gate: blocks access until the user has enrolled MFA
 * (and optionally completed the challenge for the current session).
 * Use around super-admin / admin routes.
 */
export function AdminMfaGate({ children, requireAal2 = true }: AdminMfaGateProps) {
  const { profile, aalLevel, isLoading } = useAuth();

  if (isLoading) {
    return <div className="animate-pulse rounded-xl bg-muted/30 w-full h-64" />;
  }
  if (!profile) return null;

  const mfaEnrolled = profile.mfa_enabled === true;
  const mfaVerified = aalLevel === 'aal2';

  if (!mfaEnrolled) {
    return (
      <div className="max-w-lg mx-auto mt-12 rounded-xl border border-amber-500/40 bg-amber-500/5 p-6 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-semibold">Изисква се двуфакторна автентикация</h2>
        <p className="text-sm text-muted-foreground">
          За достъп до администраторския панел трябва да активираш 2FA в настройките си.
          Това е политика за сигурност, която не може да бъде заобиколена.
        </p>
        <Button asChild>
          <Link to="/settings">Настрой 2FA</Link>
        </Button>
      </div>
    );
  }

  if (requireAal2 && !mfaVerified) {
    return (
      <div className="max-w-lg mx-auto mt-12 rounded-xl border border-amber-500/40 bg-amber-500/5 p-6 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-semibold">Преверификация на сесията</h2>
        <p className="text-sm text-muted-foreground">
          Тази сесия не е защитена с 2FA. Излез и влез отново с код от authenticator-а.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

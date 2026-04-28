import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ShieldCheck, ShieldAlert, Loader as Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { logAuthEvent } from '@/lib/authAudit';

interface Factor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
}

export function MfaSettings() {
  const { profile, aalLevel } = useAuth();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { refreshFactors(); }, []);

  async function refreshFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) { setError(error.message); return; }
    setFactors(data?.totp ?? []);
  }

  async function startEnroll() {
    setError(null); setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Authenticator (${new Date().toLocaleDateString('bg-BG')})`,
      });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setEnrolling(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка при настройка');
    } finally { setLoading(false); }
  }

  async function verifyEnroll() {
    if (!factorId || code.length !== 6) return;
    setError(null); setLoading(true);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId, challengeId: ch.id, code,
      });
      if (vErr) throw vErr;

      // Update profile flag
      await (supabase as any).from('profiles')
        .update({ mfa_enabled: true })
        .eq('id', profile?.id);

      await logAuthEvent('mfa_enrolled');
      setEnrolling(false);
      setQrCode(null); setSecret(null); setFactorId(null); setCode('');
      refreshFactors();
    } catch (e) {
      await logAuthEvent('mfa_challenge_failed', { success: false });
      setError(e instanceof Error ? e.message : 'Невалиден код');
    } finally { setLoading(false); }
  }

  async function unenroll(id: string) {
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (error) throw error;
      await (supabase as any).from('profiles')
        .update({ mfa_enabled: false })
        .eq('id', profile?.id);
      await logAuthEvent('mfa_unenrolled');
      refreshFactors();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка');
    } finally { setLoading(false); }
  }

  const verified = factors.some((f) => f.status === 'verified');

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {verified ? (
          <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
        )}
        <div className="flex-1">
          <Label>Двуфакторна автентикация (TOTP)</Label>
          <p className="text-sm text-muted-foreground">
            {verified
              ? `Активна. Сесия: ${aalLevel === 'aal2' ? 'верифицирана' : 'изисква проверка'}.`
              : 'Препоръчителна за всички акаунти. Задължителна за администратори.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {!enrolling && !verified && (
        <Button onClick={startEnroll} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          Включи 2FA
        </Button>
      )}

      {verified && !enrolling && (
        <div className="space-y-2">
          {factors.filter((f) => f.status === 'verified').map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="text-sm">
                <div className="font-medium">{f.friendly_name || 'Authenticator'}</div>
                <div className="text-xs text-muted-foreground">TOTP</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => unenroll(f.id)} disabled={loading}>
                Премахни
              </Button>
            </div>
          ))}
        </div>
      )}

      {enrolling && qrCode && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm">
            1. Сканирай QR кода с Google Authenticator / Authy / 1Password.
          </p>
          <img src={qrCode} alt="MFA QR" className="border rounded bg-white p-2 mx-auto" />
          {secret && (
            <p className="text-xs text-muted-foreground break-all text-center">
              Или ръчно: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{secret}</code>
            </p>
          )}
          <p className="text-sm">2. Въведи 6-цифрения код от приложението:</p>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="text-center font-mono text-lg tracking-widest"
            inputMode="numeric"
            maxLength={6}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEnrolling(false); setQrCode(null); }} className="flex-1">
              Отказ
            </Button>
            <Button onClick={verifyEnroll} disabled={code.length !== 6 || loading} className="flex-1 gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Потвърди
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

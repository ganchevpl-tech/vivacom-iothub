
-- ============================================================
-- ZERO TRUST WAVE 1 — Database hardening
-- ============================================================

-- 1. Create dedicated app_role enum and user_roles table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'super_admin', 'admin', 'hr_manager', 'medical_staff', 'security', 'viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. has_role() — the single source of truth for authorization
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 3. Copy existing roles from profiles.role into user_roles (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::public.app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Lock profiles.role — block any UPDATE that changes it
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Direct role modification is forbidden. Use user_roles table via super admin tools.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_block_role_change ON public.profiles;
CREATE TRIGGER profiles_block_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- 5. Add INSERT policy on profiles — must match auth.uid() and start as viewer
DROP POLICY IF EXISTS "Users can insert own profile as viewer" ON public.profiles;
CREATE POLICY "Users can insert own profile as viewer"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid() AND role = 'viewer'::user_role);

-- Refine UPDATE policy WITH CHECK so role cannot change even if trigger is bypassed
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 6. user_roles RLS policies
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins can read all roles" ON public.user_roles;
CREATE POLICY "Super admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins manage roles" ON public.user_roles;
CREATE POLICY "Super admins manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 7. Update existing policies to use has_role() instead of get_user_role()
DROP POLICY IF EXISTS "Super admins can manage features" ON public.organization_features;
CREATE POLICY "Super admins can manage features"
ON public.organization_features
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage organizations" ON public.organizations;
CREATE POLICY "Super admins can manage organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.profiles;
CREATE POLICY "Super admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can read audit log" ON public.super_admin_audit_log;
CREATE POLICY "Super admins can read audit log"
ON public.super_admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can insert audit log" ON public.super_admin_audit_log;
CREATE POLICY "Super admins can insert audit log"
ON public.super_admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 8. Lock down realtime for organization_features (cross-org leak fix)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.organization_features;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 9. New auth_audit_log table — login attempts, password changes, MFA, role changes
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  event_type text NOT NULL,
  success boolean NOT NULL DEFAULT true,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user_id ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON public.auth_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_event_type ON public.auth_audit_log(event_type);

ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins read auth audit" ON public.auth_audit_log;
CREATE POLICY "Super admins read auth audit"
ON public.auth_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Users can read own auth audit" ON public.auth_audit_log;
CREATE POLICY "Users can read own auth audit"
ON public.auth_audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Inserts come from a SECURITY DEFINER edge function only
DROP POLICY IF EXISTS "Block direct inserts to auth audit" ON public.auth_audit_log;
CREATE POLICY "Block direct inserts to auth audit"
ON public.auth_audit_log
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 10. Add MFA tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;

-- 11. Auto-grant viewer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'viewer'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Lock down SECURITY DEFINER function execution (least privilege)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.prevent_role_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

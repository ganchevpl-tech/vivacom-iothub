
-- Revoke all access from anonymous (logged-out) role
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.organizations FROM anon;
REVOKE ALL ON public.organization_features FROM anon;
REVOKE ALL ON public.super_admin_audit_log FROM anon;
REVOKE ALL ON public.auth_audit_log FROM anon;
REVOKE ALL ON public.user_dashboard_layouts FROM anon;
REVOKE ALL ON public.user_notification_settings FROM anon;

-- Make sure authenticated still has the necessary base privileges
-- (RLS policies above still gate the actual rows)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.organization_features TO authenticated;
GRANT SELECT, INSERT ON public.super_admin_audit_log TO authenticated;
GRANT SELECT ON public.auth_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_dashboard_layouts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_notification_settings TO authenticated;

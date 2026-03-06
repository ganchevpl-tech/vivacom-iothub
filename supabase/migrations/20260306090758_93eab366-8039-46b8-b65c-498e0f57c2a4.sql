
CREATE TABLE public.user_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_push boolean NOT NULL DEFAULT true,
  email_alerts boolean NOT NULL DEFAULT true,
  sms_alerts boolean NOT NULL DEFAULT false,
  viber_alerts boolean NOT NULL DEFAULT false,
  telegram_alerts boolean NOT NULL DEFAULT false,
  sound_alerts boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notification settings"
ON public.user_notification_settings FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification settings"
ON public.user_notification_settings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notification settings"
ON public.user_notification_settings FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

ALTER TABLE public.user_notification_settings
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS viber_number text,
  ADD COLUMN IF NOT EXISTS telegram_username text;
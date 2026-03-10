CREATE TABLE public.user_dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own layout"
  ON public.user_dashboard_layouts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own layout"
  ON public.user_dashboard_layouts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own layout"
  ON public.user_dashboard_layouts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
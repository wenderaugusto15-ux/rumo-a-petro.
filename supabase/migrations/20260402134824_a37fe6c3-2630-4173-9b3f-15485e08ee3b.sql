
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity"
  ON public.user_activity FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert activity"
  ON public.user_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

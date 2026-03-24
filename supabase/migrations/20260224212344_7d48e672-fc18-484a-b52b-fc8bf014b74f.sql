
-- Fix: Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Authenticated can view active questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;

CREATE POLICY "Authenticated can view active questions"
  ON public.questions FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage questions"
  ON public.questions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

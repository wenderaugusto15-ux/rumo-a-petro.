
-- Create a secure view without answer data
CREATE OR REPLACE VIEW public.questions_public
WITH (security_invoker = false)
AS SELECT
  id, statement, option_a, option_b, option_c, option_d, option_e,
  subject_id, topic_id, level, tags, active, created_at
FROM public.questions
WHERE active = true;

-- Grant SELECT on the view to authenticated and anon
GRANT SELECT ON public.questions_public TO authenticated;
GRANT SELECT ON public.questions_public TO anon;

-- Now restrict the base table: only admins can read it
DROP POLICY IF EXISTS "Authenticated can view active questions" ON public.questions;
CREATE POLICY "Only admins can read questions table"
  ON public.questions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

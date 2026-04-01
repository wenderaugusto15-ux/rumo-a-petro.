
-- Recreate view with security_invoker = true
CREATE OR REPLACE VIEW public.questions_public
WITH (security_invoker = true)
AS SELECT
  id, statement, option_a, option_b, option_c, option_d, option_e,
  subject_id, topic_id, level, tags, active, created_at
FROM public.questions
WHERE active = true;

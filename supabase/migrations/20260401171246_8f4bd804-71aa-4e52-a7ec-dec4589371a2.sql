
-- Drop the view, not needed anymore
DROP VIEW IF EXISTS public.questions_public;

-- Restore authenticated SELECT on questions (columns are still there but app doesn't fetch them)
DROP POLICY IF EXISTS "Only admins can read questions table" ON public.questions;
CREATE POLICY "Authenticated can view active questions"
  ON public.questions FOR SELECT TO authenticated
  USING (active = true);

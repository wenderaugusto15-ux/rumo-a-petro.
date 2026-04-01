
-- Create a secure table for answers (only admins can read)
CREATE TABLE public.question_answers (
  question_id uuid PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  correct_option character(1) NOT NULL,
  explanation text NOT NULL DEFAULT ''
);

ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage answers"
  ON public.question_answers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing data
INSERT INTO public.question_answers (question_id, correct_option, explanation)
SELECT id, correct_option, explanation FROM public.questions;

-- Create a SECURITY DEFINER function to check answers
CREATE OR REPLACE FUNCTION public.check_answer(_question_id uuid, _chosen_option character(1))
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'is_correct', (qa.correct_option = _chosen_option),
    'correct_option', qa.correct_option,
    'explanation', qa.explanation
  )
  FROM public.question_answers qa
  WHERE qa.question_id = _question_id;
$$;

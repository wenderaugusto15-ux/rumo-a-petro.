
-- =============================================
-- FIX 1: user_roles - prevent any non-admin INSERT
-- Drop existing INSERT policy and recreate with stricter check
-- =============================================
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Single admin management policy with both USING and WITH CHECK
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FIX 2: mock_exam_questions - add UPDATE/DELETE policies
-- =============================================
CREATE POLICY "Users can update own exam questions"
  ON public.mock_exam_questions FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mock_exams
    WHERE mock_exams.id = mock_exam_questions.mock_exam_id
      AND mock_exams.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mock_exams
    WHERE mock_exams.id = mock_exam_questions.mock_exam_id
      AND mock_exams.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own exam questions"
  ON public.mock_exam_questions FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mock_exams
    WHERE mock_exams.id = mock_exam_questions.mock_exam_id
      AND mock_exams.user_id = auth.uid()
  ));

-- =============================================
-- FIX 3: app_config - restrict to authenticated
-- =============================================
DROP POLICY IF EXISTS "Anyone can view config" ON public.app_config;
CREATE POLICY "Authenticated can view config"
  ON public.app_config FOR SELECT TO authenticated
  USING (true);

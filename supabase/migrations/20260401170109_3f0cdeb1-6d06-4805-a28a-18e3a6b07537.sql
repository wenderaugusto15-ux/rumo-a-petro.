
-- =============================================
-- FIX 1: questions - restrict SELECT to authenticated only
-- =============================================
DROP POLICY IF EXISTS "Authenticated can view active questions" ON public.questions;
CREATE POLICY "Authenticated can view active questions"
  ON public.questions FOR SELECT TO authenticated
  USING (active = true);

-- =============================================
-- FIX 2: user_roles - prevent privilege escalation
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Admin SELECT
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin INSERT with WITH CHECK
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin UPDATE with WITH CHECK
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin DELETE
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Keep users viewing own roles (already exists, just ensure TO authenticated)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- FIX 3: mock_exam_answers - add WITH CHECK
-- =============================================
DROP POLICY IF EXISTS "Users manage own exam answers" ON public.mock_exam_answers;

CREATE POLICY "Users can view own exam answers"
  ON public.mock_exam_answers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mock_exams
    WHERE mock_exams.id = mock_exam_answers.mock_exam_id
      AND mock_exams.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own exam answers"
  ON public.mock_exam_answers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM mock_exams
    WHERE mock_exams.id = mock_exam_answers.mock_exam_id
      AND mock_exams.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own exam answers"
  ON public.mock_exam_answers FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mock_exams
    WHERE mock_exams.id = mock_exam_answers.mock_exam_id
      AND mock_exams.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mock_exams
    WHERE mock_exams.id = mock_exam_answers.mock_exam_id
      AND mock_exams.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own exam answers"
  ON public.mock_exam_answers FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mock_exams
    WHERE mock_exams.id = mock_exam_answers.mock_exam_id
      AND mock_exams.user_id = auth.uid()
  ));

-- =============================================
-- FIX 4: conteudos - restrict to authenticated
-- =============================================
DROP POLICY IF EXISTS "Conteudos visíveis para todos" ON public.conteudos;
CREATE POLICY "Conteudos visíveis para autenticados"
  ON public.conteudos FOR SELECT TO authenticated
  USING (ativo = true);


-- ========================================
-- 1. ENUMS
-- ========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.question_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE public.session_status AS ENUM ('planned', 'done', 'skipped');
CREATE TYPE public.review_status AS ENUM ('pending', 'done');
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro');
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'expired');
CREATE TYPE public.mock_exam_type AS ENUM ('quick', 'full');

-- ========================================
-- 2. HELPER FUNCTIONS
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ========================================
-- 3. ROLES TABLE + SECURITY DEFINER
-- ========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========================================
-- 4. PROFILES
-- ========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT,
  track_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.subscriptions (user_id, plan, status) VALUES (NEW.id, 'free', 'active');
  INSERT INTO public.user_xp (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========================================
-- 5. CONTENT TABLES
-- ========================================
CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active tracks" ON public.tracks FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage tracks" ON public.tracks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_general BOOLEAN NOT NULL DEFAULT true,
  default_weight INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active subjects" ON public.subjects FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active topics" ON public.topics FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage topics" ON public.topics FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.track_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  weight_override INTEGER
);
ALTER TABLE public.track_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view track_subjects" ON public.track_subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage track_subjects" ON public.track_subjects FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add FK to profiles now that tracks exists
ALTER TABLE public.profiles ADD CONSTRAINT profiles_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id);

-- ========================================
-- 6. QUESTIONS
-- ========================================
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) NOT NULL,
  topic_id UUID REFERENCES public.topics(id),
  level question_level NOT NULL DEFAULT 'medium',
  statement TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A','B','C','D','E')),
  explanation TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active questions" ON public.questions FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.question_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  review_later BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);
ALTER TABLE public.question_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own flags" ON public.question_flags FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  chosen_option CHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own attempts" ON public.question_attempts FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- 7. MOCK EXAMS
-- ========================================
CREATE TABLE public.mock_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type mock_exam_type NOT NULL DEFAULT 'quick',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  total_questions INTEGER NOT NULL DEFAULT 20,
  score_percent NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mock_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own exams" ON public.mock_exams FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.mock_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_exam_id UUID REFERENCES public.mock_exams(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.mock_exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own exam questions" ON public.mock_exam_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mock_exams WHERE id = mock_exam_id AND user_id = auth.uid())
);
CREATE POLICY "Users insert own exam questions" ON public.mock_exam_questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.mock_exams WHERE id = mock_exam_id AND user_id = auth.uid())
);

CREATE TABLE public.mock_exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_exam_id UUID REFERENCES public.mock_exams(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  chosen_option CHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0
);
ALTER TABLE public.mock_exam_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own exam answers" ON public.mock_exam_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.mock_exams WHERE id = mock_exam_id AND user_id = auth.uid())
);

-- ========================================
-- 8. STUDY PLAN
-- ========================================
CREATE TABLE public.study_plan_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hours_per_week INTEGER NOT NULL DEFAULT 10,
  available_days TEXT[] DEFAULT '{Mon,Tue,Wed,Thu,Fri}',
  exam_date DATE,
  review_intervals_days INTEGER[] DEFAULT '{1,7,30}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_plan_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plan settings" ON public.study_plan_settings FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_study_plan_settings_updated_at BEFORE UPDATE ON public.study_plan_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  topic_id UUID REFERENCES public.topics(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_planned INTEGER NOT NULL DEFAULT 30,
  minutes_done INTEGER DEFAULT 0,
  status session_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  topic_id UUID REFERENCES public.topics(id),
  due_date DATE NOT NULL,
  status review_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- 9. GAMIFICATION
-- ========================================
CREATE TABLE public.user_xp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_total INTEGER NOT NULL DEFAULT 0,
  level_name TEXT NOT NULL DEFAULT 'Iniciante',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own xp" ON public.user_xp FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own xp" ON public.user_xp FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System insert xp" ON public.user_xp FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  rule_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System insert badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 10. MONETIZATION
-- ========================================
CREATE TABLE public.subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.usage_limits (
  plan subscription_plan PRIMARY KEY,
  daily_questions_limit INTEGER NOT NULL,
  weekly_mocks_limit INTEGER NOT NULL
);
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view limits" ON public.usage_limits FOR SELECT USING (true);

CREATE TABLE public.usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  mocks_started INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own counters" ON public.usage_counters FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- 11. TESTIMONIALS & APP CONFIG
-- ========================================
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER,
  city TEXT,
  text TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active testimonials" ON public.testimonials FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage testimonials" ON public.testimonials FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage config" ON public.app_config FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========================================
-- 12. TRIGGER FOR NEW USER SIGNUP
-- ========================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 13. XP UPDATE FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION public.add_xp(_user_id UUID, _amount INTEGER)
RETURNS VOID AS $$
DECLARE
  new_total INTEGER;
  new_level TEXT;
BEGIN
  UPDATE public.user_xp SET xp_total = xp_total + _amount, updated_at = now()
  WHERE user_id = _user_id;
  
  SELECT xp_total INTO new_total FROM public.user_xp WHERE user_id = _user_id;
  
  new_level := CASE
    WHEN new_total >= 5000 THEN 'Aprovado'
    WHEN new_total >= 2500 THEN 'Engenheiro'
    WHEN new_total >= 1000 THEN 'Técnico'
    WHEN new_total >= 300 THEN 'Operador'
    ELSE 'Iniciante'
  END;
  
  UPDATE public.user_xp SET level_name = new_level WHERE user_id = _user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

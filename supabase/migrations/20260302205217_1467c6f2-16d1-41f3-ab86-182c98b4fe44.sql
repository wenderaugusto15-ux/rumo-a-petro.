-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for text search on question statements
CREATE INDEX IF NOT EXISTS idx_questions_statement_trgm ON public.questions USING GIN(statement gin_trgm_ops);

-- Composite index for common filter patterns
CREATE INDEX IF NOT EXISTS idx_questions_subject_level_active ON public.questions(subject_id, level, active);

-- Index for ordering by created_at
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at DESC);

-- Index for question_attempts lookups
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_question ON public.question_attempts(user_id, question_id);
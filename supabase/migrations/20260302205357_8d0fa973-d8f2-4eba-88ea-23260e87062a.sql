-- Drop the dependent index first, then move extension
DROP INDEX IF EXISTS public.idx_questions_statement_trgm;
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Recreate index using extensions schema operator
CREATE INDEX IF NOT EXISTS idx_questions_statement_trgm ON public.questions USING GIN(statement extensions.gin_trgm_ops);

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plano text NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS plano_ativo_ate timestamp with time zone;

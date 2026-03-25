
-- Add trial columns to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Set trial dates for all existing free users (give them 2 days from now)
UPDATE public.subscriptions 
SET trial_started_at = now(), trial_ends_at = now() + INTERVAL '2 days'
WHERE plan = 'free' AND trial_started_at IS NULL;

-- Update handle_new_user to include trial dates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.subscriptions (user_id, plan, status, trial_started_at, trial_ends_at) 
  VALUES (NEW.id, 'free', 'active', now(), now() + INTERVAL '2 days');
  INSERT INTO public.user_xp (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

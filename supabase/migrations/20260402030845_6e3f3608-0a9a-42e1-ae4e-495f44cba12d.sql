
-- Remove existing role for the user, then insert master
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'wenderaugusto91@hotmail.com');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'master'::app_role FROM auth.users
WHERE email = 'wenderaugusto91@hotmail.com';

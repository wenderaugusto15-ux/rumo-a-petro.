-- Allow admins to manage usage_limits
CREATE POLICY "Admins can manage usage_limits"
ON public.usage_limits
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

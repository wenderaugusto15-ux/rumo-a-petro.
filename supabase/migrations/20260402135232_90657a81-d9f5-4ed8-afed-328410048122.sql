ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_roles"
  ON public.admin_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
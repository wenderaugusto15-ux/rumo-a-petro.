
-- Admin CRUD policies for materias
CREATE POLICY "Admins can manage materias"
ON public.materias
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin CRUD policies for modulos
CREATE POLICY "Admins can manage modulos"
ON public.modulos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin CRUD policies for conteudos
CREATE POLICY "Admins can manage conteudos"
ON public.conteudos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

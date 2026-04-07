
DROP POLICY "Service can insert sync logs" ON public.sync_log;
DROP POLICY "Service can update sync logs" ON public.sync_log;

CREATE POLICY "Admins can insert sync logs"
  ON public.sync_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sync logs"
  ON public.sync_log FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

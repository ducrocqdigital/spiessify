-- Close write access for anonymous visitors and restrict management
-- to Oberadmin/Chargierte (same check the penalties table already uses).

-- events
DROP POLICY "Only authenticated users can manage events" ON public.events;
CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.user_can_manage_members())
  WITH CHECK (public.user_can_manage_members());

-- inspection_sessions
DROP POLICY "Only authenticated users can manage inspection sessions" ON public.inspection_sessions;
CREATE POLICY "Admins can manage inspection sessions" ON public.inspection_sessions
  FOR ALL TO authenticated
  USING (public.user_can_manage_members())
  WITH CHECK (public.user_can_manage_members());

-- inspection_results
DROP POLICY "Only authenticated users can manage inspection results" ON public.inspection_results;
CREATE POLICY "Admins can manage inspection results" ON public.inspection_results
  FOR ALL TO authenticated
  USING (public.user_can_manage_members())
  WITH CHECK (public.user_can_manage_members());

-- penalty_catalog
DROP POLICY "Only authenticated users can manage penalty catalog" ON public.penalty_catalog;
CREATE POLICY "Admins can manage penalty catalog" ON public.penalty_catalog
  FOR ALL TO authenticated
  USING (public.user_can_manage_members())
  WITH CHECK (public.user_can_manage_members());

-- user_roles: only Oberadmin may change roles (no more self-escalation)
DROP POLICY "Authenticated users only - manage user roles" ON public.user_roles;
CREATE POLICY "Oberadmin can manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'oberadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'oberadmin'));

-- checkin tables: same admin check instead of any authenticated user
DROP POLICY "Authenticated can manage checkin sessions" ON public.checkin_sessions;
CREATE POLICY "Admins can manage checkin sessions" ON public.checkin_sessions
  FOR ALL TO authenticated
  USING (public.user_can_manage_members())
  WITH CHECK (public.user_can_manage_members());

DROP POLICY "Authenticated can manage checkin results" ON public.checkin_results;
CREATE POLICY "Admins can manage checkin results" ON public.checkin_results
  FOR ALL TO authenticated
  USING (public.user_can_manage_members())
  WITH CHECK (public.user_can_manage_members());

-- storage: anonymous visitors may only view photos, admins manage them
DROP POLICY "Anyone can delete member photos" ON storage.objects;
DROP POLICY "Anyone can update member photos" ON storage.objects;
DROP POLICY "Anyone can upload member photos" ON storage.objects;
DROP POLICY "Authenticated users can delete member photos" ON storage.objects;
DROP POLICY "Authenticated users can update member photos" ON storage.objects;
DROP POLICY "Authenticated users can upload member photos" ON storage.objects;
CREATE POLICY "Admins can upload member photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'member-photos' AND public.user_can_manage_members());
CREATE POLICY "Admins can update member photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'member-photos' AND public.user_can_manage_members());
CREATE POLICY "Admins can delete member photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'member-photos' AND public.user_can_manage_members());

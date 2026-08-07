CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

ALTER POLICY "Admins can delete brands" ON public.brands USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can insert brands" ON public.brands WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can update brands" ON public.brands USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can delete catalogs" ON public.catalogs USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can insert catalogs" ON public.catalogs WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can update catalogs" ON public.catalogs USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can delete categories" ON public.categories USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can insert categories" ON public.categories WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can update categories" ON public.categories USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can delete products" ON public.products USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can insert products" ON public.products WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can update products" ON public.products USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can view products" ON public.products USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can delete settings" ON public.settings USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can insert settings" ON public.settings WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins can update settings" ON public.settings USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can manage roles" ON public.user_roles USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (qual LIKE '%has_role%' OR with_check LIKE '%has_role%')
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON storage.objects%s%s',
      policy_row.policyname,
      CASE WHEN policy_row.qual IS NOT NULL THEN ' USING (' || replace(policy_row.qual, 'has_role(', 'private.has_role(') || ')' ELSE '' END,
      CASE WHEN policy_row.with_check IS NOT NULL THEN ' WITH CHECK (' || replace(policy_row.with_check, 'has_role(', 'private.has_role(') || ')' ELSE '' END
    );
  END LOOP;
END
$$;

DROP FUNCTION public.has_role(uuid, public.app_role);
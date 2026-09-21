-- 1) Products: ensure anon has no access to sensitive columns (defense in depth)
REVOKE ALL ON public.products FROM anon;
GRANT SELECT (id, catalog_id, code, name, category, brand, unit, image_url, sort_order, created_at, updated_at, is_visible, descricao_ativo, qtd, price_visible, public_price, public_preco_unitario) ON public.products TO anon;

REVOKE ALL ON public.products_public FROM anon, authenticated;
GRANT SELECT ON public.products_public TO anon, authenticated;

-- 2) Vendors: hide phone numbers from public listing
REVOKE ALL ON public.vendors FROM anon;

CREATE OR REPLACE VIEW public.vendors_public
WITH (security_invoker = on) AS
SELECT id, name, avatar_url, role_title, is_active, sort_order
FROM public.vendors
WHERE is_active = true;

GRANT SELECT ON public.vendors_public TO anon, authenticated;

-- anon still needs row visibility through RLS for the invoker view
DROP POLICY IF EXISTS "Anyone can view active vendors" ON public.vendors;
CREATE POLICY "Public can view active vendors"
ON public.vendors FOR SELECT
TO anon, authenticated
USING (is_active = true OR private.has_role(auth.uid(), 'admin'::app_role));

-- allow anon to read only the non-sensitive columns of vendors (needed by the view)
GRANT SELECT (id, name, avatar_url, role_title, is_active, sort_order) ON public.vendors TO anon;

-- 3) Phone is only retrievable one vendor at a time
CREATE OR REPLACE FUNCTION public.get_vendor_phone(_vendor_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.phone FROM public.vendors v
  WHERE v.id = _vendor_id AND v.is_active = true
$$;

REVOKE ALL ON FUNCTION public.get_vendor_phone(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_vendor_phone(uuid) TO anon, authenticated, service_role;
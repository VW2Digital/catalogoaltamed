-- 1. Products: restrict full table to admins, expose safe public view
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Admins can view products"
  ON public.products FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT ON public.products FROM anon;

CREATE OR REPLACE VIEW public.products_public
WITH (security_invoker = off) AS
SELECT id, catalog_id, code, name, category, brand, unit, price,
       image_url, sort_order, is_visible, descricao_ativo,
       created_at, updated_at
FROM public.products
WHERE is_visible = true;

GRANT SELECT ON public.products_public TO anon, authenticated;

-- 2. catalog-assets storage: admin-only writes
DROP POLICY IF EXISTS "Authenticated can upload catalog assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update catalog assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete catalog assets" ON storage.objects;

CREATE POLICY "Admins can upload catalog assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catalog-assets' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update catalog assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'catalog-assets' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete catalog assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'catalog-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- 3. Remove broad listing of public buckets (public URLs still work)
DROP POLICY IF EXISTS "Catalog assets are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view branding files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly readable" ON storage.objects;

CREATE POLICY "Admins can list branding files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('branding','catalog-assets','product-images')
         AND has_role(auth.uid(), 'admin'::app_role));

-- 4. Security definer function not directly callable from the API
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
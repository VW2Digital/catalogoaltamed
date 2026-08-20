-- 1) Remove anon access to the base products table
DROP POLICY IF EXISTS "Anyone can view visible products" ON public.products;
REVOKE ALL ON public.products FROM anon;

-- 2) Public view: only visible products, prices masked when price_visible = false
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public
WITH (security_invoker = off) AS
SELECT
  p.id,
  p.catalog_id,
  p.code,
  p.name,
  p.category,
  p.brand,
  p.unit,
  p.descricao_ativo,
  p.image_url,
  p.qtd,
  p.sort_order,
  p.is_visible,
  p.price_visible,
  CASE WHEN p.price_visible THEN p.price END AS price,
  CASE WHEN p.price_visible THEN p.preco_unitario END AS preco_unitario,
  p.created_at,
  p.updated_at
FROM public.products p
WHERE p.is_visible = true;

ALTER VIEW public.products_public OWNER TO postgres;
GRANT SELECT ON public.products_public TO anon, authenticated;
GRANT ALL ON public.products_public TO service_role;
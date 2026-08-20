-- Generated public-safe price columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS public_price numeric
    GENERATED ALWAYS AS (CASE WHEN price_visible THEN price END) STORED,
  ADD COLUMN IF NOT EXISTS public_preco_unitario numeric
    GENERATED ALWAYS AS (CASE WHEN price_visible THEN preco_unitario END) STORED;

-- Public view runs with the caller's permissions
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public
WITH (security_invoker = on) AS
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
  p.public_price AS price,
  p.public_preco_unitario AS preco_unitario,
  p.created_at,
  p.updated_at
FROM public.products p
WHERE p.is_visible = true;

GRANT SELECT ON public.products_public TO anon, authenticated;
GRANT ALL ON public.products_public TO service_role;

-- Anon may read only public-safe columns, and only visible products
REVOKE ALL ON public.products FROM anon;
GRANT SELECT (
  id, catalog_id, code, name, category, brand, unit, descricao_ativo,
  image_url, qtd, sort_order, is_visible, price_visible,
  public_price, public_preco_unitario, created_at, updated_at
) ON public.products TO anon;

DROP POLICY IF EXISTS "Anyone can view visible products" ON public.products;
CREATE POLICY "Anon can view public columns of visible products"
ON public.products FOR SELECT TO anon
USING (is_visible = true);
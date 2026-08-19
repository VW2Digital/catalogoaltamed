ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_visible boolean NOT NULL DEFAULT true;

GRANT SELECT (price_visible) ON public.products TO anon;

DROP VIEW IF EXISTS public.products_public;

CREATE VIEW public.products_public
WITH (security_invoker = on) AS
  SELECT id, catalog_id, code, name, category, brand, unit, price, preco_unitario, qtd,
         image_url, sort_order, is_visible, price_visible, descricao_ativo, created_at, updated_at
    FROM public.products
   WHERE is_visible = true;

GRANT SELECT ON public.products_public TO anon, authenticated;
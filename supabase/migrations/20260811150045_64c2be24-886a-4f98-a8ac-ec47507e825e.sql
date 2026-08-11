DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public
WITH (security_invoker = true)
AS SELECT id, catalog_id, code, name, category, brand, unit, price, qtd, image_url, sort_order, is_visible, descricao_ativo, created_at, updated_at
FROM public.products;
GRANT SELECT ON public.products_public TO anon, authenticated;
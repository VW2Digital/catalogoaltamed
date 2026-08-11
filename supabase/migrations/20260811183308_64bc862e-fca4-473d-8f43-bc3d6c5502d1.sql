CREATE OR REPLACE VIEW public.products_public
WITH (security_invoker = false) AS
SELECT id, catalog_id, code, name, category, brand, unit, price, qtd, image_url, sort_order, is_visible, descricao_ativo, created_at, updated_at
FROM public.products
WHERE is_visible = true;

GRANT SELECT ON public.products_public TO anon, authenticated;
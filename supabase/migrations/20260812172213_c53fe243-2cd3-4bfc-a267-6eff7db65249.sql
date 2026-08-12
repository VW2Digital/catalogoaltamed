-- 1) Make the public view respect the querying user's permissions
ALTER VIEW public.products_public SET (security_invoker = on);

-- 2) Remove blanket column access for anonymous visitors on the base table
REVOKE SELECT ON public.products FROM anon;

-- 3) Grant anon SELECT only on customer-relevant columns (RLS still limits rows)
GRANT SELECT (
  id, catalog_id, code, name, category, brand, unit, price, qtd,
  image_url, sort_order, is_visible, descricao_ativo, created_at, updated_at
) ON public.products TO anon;

-- 4) Ensure the view itself is readable
GRANT SELECT ON public.products_public TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
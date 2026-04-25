ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_products_catalog_visible ON public.products (catalog_id, is_visible);
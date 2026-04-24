-- Function: normalize a product's brand to the canonical name stored in public.brands
CREATE OR REPLACE FUNCTION public.normalize_product_brand()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  canonical TEXT;
BEGIN
  IF NEW.brand IS NULL OR TRIM(NEW.brand) = '' THEN
    RETURN NEW;
  END IF;

  SELECT b.name
    INTO canonical
    FROM public.brands b
   WHERE b.catalog_id = NEW.catalog_id
     AND LOWER(b.name) = LOWER(TRIM(NEW.brand))
   LIMIT 1;

  IF canonical IS NOT NULL THEN
    NEW.brand := canonical;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: run on insert and on brand/catalog change
DROP TRIGGER IF EXISTS products_normalize_brand ON public.products;
CREATE TRIGGER products_normalize_brand
BEFORE INSERT OR UPDATE OF brand, catalog_id ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.normalize_product_brand();

-- One-off backfill: align existing products with the canonical brand names
UPDATE public.products p
   SET brand = b.name
  FROM public.brands b
 WHERE b.catalog_id = p.catalog_id
   AND p.brand IS NOT NULL
   AND TRIM(p.brand) <> ''
   AND LOWER(TRIM(p.brand)) = LOWER(b.name)
   AND p.brand IS DISTINCT FROM b.name;
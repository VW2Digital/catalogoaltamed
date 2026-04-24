-- Fix: set search_path on trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix: remove broad SELECT policy on storage.objects for product-images.
-- Public bucket already serves files via public URL without needing listing rights.
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
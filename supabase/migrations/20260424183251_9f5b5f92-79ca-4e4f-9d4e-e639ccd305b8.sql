-- Add cover and icon columns to catalogs
ALTER TABLE public.catalogs
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS icon_url text;

-- Create public bucket for catalog assets (covers + icons)
INSERT INTO storage.buckets (id, name, public)
VALUES ('catalog-assets', 'catalog-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Catalog assets are publicly readable" ON storage.objects;
CREATE POLICY "Catalog assets are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'catalog-assets');

-- Authenticated users (admins) can upload
DROP POLICY IF EXISTS "Authenticated can upload catalog assets" ON storage.objects;
CREATE POLICY "Authenticated can upload catalog assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'catalog-assets');

-- Authenticated users can update
DROP POLICY IF EXISTS "Authenticated can update catalog assets" ON storage.objects;
CREATE POLICY "Authenticated can update catalog assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'catalog-assets');

-- Authenticated users can delete
DROP POLICY IF EXISTS "Authenticated can delete catalog assets" ON storage.objects;
CREATE POLICY "Authenticated can delete catalog assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'catalog-assets');
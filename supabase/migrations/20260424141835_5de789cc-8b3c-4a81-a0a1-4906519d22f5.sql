-- Create branding storage bucket (public for logo display)
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view branding files
CREATE POLICY "Anyone can view branding files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'branding');

-- Admins can upload branding files
CREATE POLICY "Admins can upload branding files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));

-- Admins can update branding files
CREATE POLICY "Admins can update branding files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete branding files
CREATE POLICY "Admins can delete branding files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));
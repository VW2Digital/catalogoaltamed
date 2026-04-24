-- Create brands table mirroring categories structure
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (catalog_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Public read (catalog is public-facing)
CREATE POLICY "Brands are viewable by everyone"
ON public.brands
FOR SELECT
USING (true);

-- Admins can manage
CREATE POLICY "Admins can insert brands"
ON public.brands
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update brands"
ON public.brands
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete brands"
ON public.brands
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER brands_set_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Helpful index for catalog lookups
CREATE INDEX idx_brands_catalog_id ON public.brands(catalog_id);
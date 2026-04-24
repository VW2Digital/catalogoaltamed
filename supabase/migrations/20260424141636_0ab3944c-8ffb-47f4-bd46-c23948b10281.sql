
INSERT INTO public.settings (key, value) VALUES
  ('store_name', ''),
  ('store_description', ''),
  ('logo_url', ''),
  ('primary_color', ''),
  ('font_heading', ''),
  ('font_body', ''),
  ('custom_css', '')
ON CONFLICT (key) DO NOTHING;

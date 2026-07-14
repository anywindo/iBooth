-- Add public read access to templates
CREATE POLICY templates_public_read ON public.templates
  FOR SELECT
  USING (true);

-- Add public read access to profiles for creator names
CREATE POLICY profiles_public_read ON public.profiles
  FOR SELECT
  USING (true);

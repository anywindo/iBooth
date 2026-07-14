-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_self_read ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_self_insert ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Templates table
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled',
  preset_id text NOT NULL DEFAULT 'strip-51x152',
  dpi integer NOT NULL DEFAULT 300,
  width integer NOT NULL DEFAULT 602,
  height integer NOT NULL DEFAULT 1795,
  slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  frame_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX templates_owner_idx ON public.templates(owner_id);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_owner_all ON public.templates
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- updated_at trigger
CREATE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER templates_updated_at BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for frames
INSERT INTO storage.buckets (id, name, public) VALUES ('frames', 'frames', true);

CREATE POLICY frames_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'frames' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY frames_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'frames');

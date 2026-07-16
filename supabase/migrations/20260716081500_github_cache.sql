-- Create github_cache table
CREATE TABLE public.github_cache (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.github_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for public (anon & authenticated) access
CREATE POLICY github_cache_public_read ON public.github_cache
  FOR SELECT TO public USING (true);

CREATE POLICY github_cache_public_write ON public.github_cache
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Grant privileges to authenticated and anon users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.github_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.github_cache TO anon;

-- Grant privileges to authenticated and anon users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT SELECT ON public.templates TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

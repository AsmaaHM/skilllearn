REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.skills FROM anon;
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.profiles FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.skills FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
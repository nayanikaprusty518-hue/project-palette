REVOKE ALL ON FUNCTION public.handle_application_accept() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_project_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_project_owner(UUID) TO authenticated;
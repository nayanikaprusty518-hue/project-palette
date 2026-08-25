CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  department TEXT,
  year_of_study TEXT,
  bio TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  weekly_hours INTEGER NOT NULL DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  domain TEXT NOT NULL,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  slots_total INTEGER NOT NULL DEFAULT 1,
  slots_filled INTEGER NOT NULL DEFAULT 0,
  is_open BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pitch_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role_id, applicant_id)
);

CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_roles_project ON public.roles(project_id);
CREATE INDEX idx_apps_project ON public.applications(project_id);
CREATE INDEX idx_apps_applicant ON public.applications(applicant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.owner_id = auth.uid());
$$;

CREATE POLICY "roles_select" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_insert_owner" ON public.roles FOR INSERT TO authenticated WITH CHECK (public.is_project_owner(project_id));
CREATE POLICY "roles_update_owner" ON public.roles FOR UPDATE TO authenticated USING (public.is_project_owner(project_id)) WITH CHECK (public.is_project_owner(project_id));
CREATE POLICY "roles_delete_owner" ON public.roles FOR DELETE TO authenticated USING (public.is_project_owner(project_id));

CREATE POLICY "apps_select" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = applicant_id OR public.is_project_owner(project_id));
CREATE POLICY "apps_insert_own" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "apps_update_owner" ON public.applications FOR UPDATE TO authenticated USING (public.is_project_owner(project_id)) WITH CHECK (public.is_project_owner(project_id));
CREATE POLICY "apps_delete_own" ON public.applications FOR DELETE TO authenticated USING (auth.uid() = applicant_id);

CREATE OR REPLACE FUNCTION public.handle_application_accept()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    UPDATE public.roles
      SET slots_filled = LEAST(slots_filled + 1, slots_total),
          is_open = (LEAST(slots_filled + 1, slots_total) < slots_total)
    WHERE id = NEW.role_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_application_accept
AFTER UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.handle_application_accept();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS persona text NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS research_focus text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_persona_check CHECK (persona IN ('student','professional','researcher'));
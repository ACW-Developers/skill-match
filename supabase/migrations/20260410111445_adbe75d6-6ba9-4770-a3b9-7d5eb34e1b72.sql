
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS id_number text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Kenya',
  ADD COLUMN IF NOT EXISTS county text,
  ADD COLUMN IF NOT EXISTS constituency text,
  ADD COLUMN IF NOT EXISTS ward text;

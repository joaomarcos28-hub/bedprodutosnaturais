ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS days_worked integer;
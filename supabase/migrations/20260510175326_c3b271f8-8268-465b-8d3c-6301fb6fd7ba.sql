
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  university_email TEXT NOT NULL UNIQUE,
  university_id TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  college TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male','female')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check membership"
ON public.members FOR SELECT
USING (true);

CREATE POLICY "Anyone can register"
ON public.members FOR INSERT
WITH CHECK (true);

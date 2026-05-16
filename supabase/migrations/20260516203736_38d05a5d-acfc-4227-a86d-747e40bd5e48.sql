-- Explicit deny-all RLS policies for the members table.
-- All app access happens via trusted server functions using the service role
-- (which bypasses RLS). These explicit policies make the intent clear and
-- silence the "RLS enabled, no policy" linter warning.

CREATE POLICY "Deny all select to anon and authenticated"
ON public.members
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "Deny all insert to anon and authenticated"
ON public.members
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny all update to anon and authenticated"
ON public.members
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all delete to anon and authenticated"
ON public.members
AS RESTRICTIVE
FOR DELETE
TO anon, authenticated
USING (false);
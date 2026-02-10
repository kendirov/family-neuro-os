-- Allow anon to UPDATE profiles so timer stop/pause and balance deduction persist.
-- Without this, UPDATE affects 0 rows and refresh restores old state.
-- SELECT is also ensured so fetchState and realtime keep working.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow anon to read all profiles (for timer sync and balance display)
DROP POLICY IF EXISTS "profiles_anon_select" ON public.profiles;
CREATE POLICY "profiles_anon_select"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

-- Allow anon to update all profiles (for timer_status, balance, seconds_today on stop/pause)
DROP POLICY IF EXISTS "profiles_anon_update" ON public.profiles;
CREATE POLICY "profiles_anon_update"
  ON public.profiles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

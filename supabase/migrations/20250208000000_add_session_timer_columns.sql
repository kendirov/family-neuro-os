-- Server-side timer sync: session_start_at, last_burn_at, session_mode per pilot (profile).
-- Run this in Supabase SQL editor or via `supabase db push` if using Supabase CLI.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS session_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_burn_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_mode text,
  ADD COLUMN IF NOT EXISTS session_balance_at_start integer;

COMMENT ON COLUMN public.profiles.session_start_at IS 'When engine was started; used for drift-free elapsed and cross-device resume.';
COMMENT ON COLUMN public.profiles.last_burn_at IS 'Last minute XP burn; used for offline catch-up and to avoid double-charge.';
COMMENT ON COLUMN public.profiles.session_mode IS 'Current session mode: game | youtube.';
COMMENT ON COLUMN public.profiles.session_balance_at_start IS 'Balance at session start; burn cap (bankruptcy protection).';

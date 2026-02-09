-- Server-authoritative timer synchronization: timer state stored in profiles table.
-- This ensures perfect multi-device sync - starting a timer on Device A shows on Device B.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timer_status text DEFAULT 'idle' CHECK (timer_status IN ('idle', 'running', 'paused')),
  ADD COLUMN IF NOT EXISTS timer_mode text CHECK (timer_mode IN ('game', 'cartoon')),
  ADD COLUMN IF NOT EXISTS timer_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS seconds_accumulated_today integer DEFAULT 0;

COMMENT ON COLUMN public.profiles.timer_status IS 'Current timer state: idle, running, or paused. Server-authoritative for multi-device sync.';
COMMENT ON COLUMN public.profiles.timer_mode IS 'Current timer mode: game or cartoon.';
COMMENT ON COLUMN public.profiles.timer_start_at IS 'When the current segment started (for running/paused timers). Used to calculate elapsed time.';
COMMENT ON COLUMN public.profiles.seconds_accumulated_today IS 'Total seconds burned today BEFORE the current session. Updated on pause/stop.';

-- Index for efficient queries on timer status
CREATE INDEX IF NOT EXISTS idx_profiles_timer_status ON public.profiles(timer_status) WHERE timer_status != 'idle';

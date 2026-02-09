-- Rename seconds_accumulated_today to seconds_today for clarity
-- Ensure timer columns match the exact specification

ALTER TABLE public.profiles
  RENAME COLUMN IF EXISTS seconds_accumulated_today TO seconds_today;

-- Ensure all timer columns exist with correct defaults and constraints
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timer_status text DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS timer_mode text DEFAULT 'game',
  ADD COLUMN IF NOT EXISTS timer_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS seconds_today integer DEFAULT 0;

-- Add constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_timer_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_timer_status_check 
      CHECK (timer_status IN ('idle', 'running', 'paused'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_timer_mode_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_timer_mode_check 
      CHECK (timer_mode IN ('game', 'cartoon'));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.timer_status IS 'Current timer state: idle, running, or paused. Server-authoritative for multi-device sync.';
COMMENT ON COLUMN public.profiles.timer_mode IS 'Current timer mode: game or cartoon.';
COMMENT ON COLUMN public.profiles.timer_start_at IS 'Timestamp when the CURRENT segment started. Used to calculate elapsed time for running timers.';
COMMENT ON COLUMN public.profiles.seconds_today IS 'Total ACCUMULATED seconds played today (excluding current run). Updated on pause/stop.';

-- Index for efficient queries on timer status
CREATE INDEX IF NOT EXISTS idx_profiles_timer_status ON public.profiles(timer_status) WHERE timer_status != 'idle';

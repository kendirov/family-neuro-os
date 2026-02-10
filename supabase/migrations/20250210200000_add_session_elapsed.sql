-- True Pause/Resume: save current session length when paused so resume continues from same second.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS session_elapsed integer DEFAULT 0;

COMMENT ON COLUMN public.profiles.session_elapsed IS 'When paused: session length in seconds. Cleared on start/resume and on stop.';

-- Tiered rate system: track today_game_time and today_media_time separately per user.
-- Used for progressive burn rate calculation (Media: 0-20 free, 21-60 cheap, 60+ penalty; Games: 0-60 standard, 60+ overheat).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS today_game_time integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS today_media_time integer DEFAULT 0;

COMMENT ON COLUMN public.profiles.today_game_time IS 'Minutes of game time today (for tiered burn rate: 0-60 = 1 XP/min, 60+ = 2 XP/min).';
COMMENT ON COLUMN public.profiles.today_media_time IS 'Minutes of media time today (for tiered burn rate: 0-20 = 0 XP/min, 21-60 = 0.5 XP/min, 60+ = 2 XP/min).';

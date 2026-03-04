-- =============================================================================
-- Daily Points → Spins: 1 спин за 50 очков, заработанных сегодня.
-- daily_points_earned: сумма earn-транзакций за сегодня.
-- spins_used_today: сколько спинов использовано сегодня.
-- available_spins = floor(daily_points_earned / 50) - spins_used_today
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_points_earned integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spins_used_today integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_daily_reset date;

COMMENT ON COLUMN public.profiles.daily_points_earned IS 'Очки, заработанные сегодня (только earn). 1 спин = 50 очков.';
COMMENT ON COLUMN public.profiles.spins_used_today IS 'Спинов использовано сегодня (Daily Roulette).';
COMMENT ON COLUMN public.profiles.last_daily_reset IS 'Дата последнего сброса daily_points_earned и spins_used_today.';

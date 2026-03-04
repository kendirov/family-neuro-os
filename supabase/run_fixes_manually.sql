-- =============================================================================
-- Ручной запуск исправлений (Supabase SQL Editor)
-- Скопируйте нужные блоки и выполните.
-- =============================================================================

-- 1. Realtime — принудительно добавить таблицы (если ещё не добавлены)
-- Если таблица уже в publication, будет ошибка — можно игнорировать.
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE timer_presets;

-- 2. Daily Roulette — колонки в profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_spins_remaining integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_spin_date date;

-- 3. transactions — конвертировать id из uuid в text (если 400)
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'id';
  IF col_type = 'uuid' THEN
    ALTER TABLE public.transactions ALTER COLUMN id TYPE text USING id::text;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =============================================================================
-- Fix transactions 400 error + Realtime + Daily Roulette schema
-- Запустите в Supabase SQL Editor или: supabase db push
-- =============================================================================

-- =============================================================================
-- 1. transactions — исправление 400 Bad Request
-- Причина: id мог быть uuid (insert с id: "1234567890" или без id ломает клиент).
-- Решение: id text, все нужные колонки.
-- =============================================================================

-- Создать таблицу если её нет (миграции только ALTER)
CREATE TABLE IF NOT EXISTS public.transactions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  type text NOT NULL,
  status text,
  created_at timestamptz DEFAULT now(),
  task_definition_id text REFERENCES public.task_definitions(id) ON DELETE SET NULL
);

-- Добавить недостающие колонки
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS task_definition_id text;

-- Конвертировать id из uuid в text (если таблица была создана со старой схемой)
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

-- RLS: полный доступ для разработки (если policies не заданы)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transactions_allow_all" ON public.transactions;
CREATE POLICY "transactions_allow_all" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 2. Realtime — добавить таблицы в publication (если ещё не добавлены)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'active_sessions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'timer_presets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE timer_presets;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =============================================================================
-- 3. Daily Roulette — колонки в profiles
-- daily_spins_remaining: сколько спинов осталось сегодня (сбрасывается в 3 каждый день)
-- last_spin_date: дата последнего спина (YYYY-MM-DD) для проверки «новый день»
-- =============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_spins_remaining integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_spin_date date;

COMMENT ON COLUMN public.profiles.daily_spins_remaining IS 'Daily Roulette: спинов осталось сегодня. Сбрасывается в 3 при новом дне.';
COMMENT ON COLUMN public.profiles.last_spin_date IS 'Daily Roulette: дата последнего спина. Для проверки сброса при новом дне.';

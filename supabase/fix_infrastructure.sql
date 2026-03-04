-- =============================================================================
-- FIX INFRASTRUCTURE: timer_presets, active_sessions, transactions, Realtime
-- Запустите этот скрипт в Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================================

-- =============================================================================
-- 1. timer_presets — настраиваемые правила таймера
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.timer_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  safe_minutes integer NOT NULL DEFAULT 0,
  base_cost_per_min double precision NOT NULL DEFAULT 1.0,
  penalty_multiplier_x2_after_mins integer,
  penalty_multiplier_x3_after_mins integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name)
);

COMMENT ON TABLE public.timer_presets IS 'Пресеты таймера: правила лимитов и штрафов.';

INSERT INTO public.timer_presets (name, safe_minutes, base_cost_per_min, penalty_multiplier_x2_after_mins, penalty_multiplier_x3_after_mins)
VALUES
  ('Strict Weekday', 60, 1.0, 60, 90),
  ('Weekend Relax', 120, 0.5, NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 2. active_sessions — источник истины для текущей сессии таймера
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('game', 'cartoon')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  started_at timestamptz,
  accumulated_seconds integer NOT NULL DEFAULT 0,
  active_preset_id uuid REFERENCES public.timer_presets(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

COMMENT ON TABLE public.active_sessions IS 'Активные/приостановленные сессии таймера.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_sessions_one_per_user
  ON public.active_sessions (user_id)
  WHERE status IN ('active', 'paused');

CREATE INDEX IF NOT EXISTS idx_active_sessions_status
  ON public.active_sessions (status)
  WHERE status IN ('active', 'paused');

-- =============================================================================
-- 3. transactions — создать если нет, добавить недостающие колонки
-- Frontend использует: id (text!), user_id, amount, description, type, status, created_at, task_definition_id
-- ВАЖНО: id должен быть text — stopTimer передаёт id: Date.now().toString()
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  type text NOT NULL,
  status text,
  created_at timestamptz DEFAULT now(),
  task_definition_id text
);

-- Добавить колонки если таблица уже существовала со старой схемой
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS task_definition_id text;

-- Если id был uuid — конвертировать в text (400 при insert с id: "1234567890")
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

-- =============================================================================
-- 4. RLS — включить и разрешить всё для разработки (authenticated + anon)
-- =============================================================================
ALTER TABLE public.timer_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- timer_presets: SELECT для всех
DROP POLICY IF EXISTS "timer_presets_allow_all" ON public.timer_presets;
CREATE POLICY "timer_presets_allow_all" ON public.timer_presets FOR ALL USING (true) WITH CHECK (true);

-- active_sessions: SELECT, INSERT, UPDATE для всех
DROP POLICY IF EXISTS "active_sessions_anon_select" ON public.active_sessions;
DROP POLICY IF EXISTS "active_sessions_anon_insert" ON public.active_sessions;
DROP POLICY IF EXISTS "active_sessions_anon_update" ON public.active_sessions;
DROP POLICY IF EXISTS "active_sessions_allow_all" ON public.active_sessions;
CREATE POLICY "active_sessions_allow_all" ON public.active_sessions FOR ALL USING (true) WITH CHECK (true);

-- transactions: полный доступ для разработки
DROP POLICY IF EXISTS "transactions_allow_all" ON public.transactions;
CREATE POLICY "transactions_allow_all" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 5. Realtime — добавить таблицы в publication (если ещё не добавлены)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'timer_presets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE timer_presets;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'active_sessions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Timer & Penalty System: server-truth schema.
-- Source of truth for elapsed time: accumulated_seconds + (now - started_at) when status='active'.
-- Survives page reloads and browser closures.

-- =============================================================================
-- 1. timer_presets — настраиваемые правила (Строгий будний, Выходной и т.д.)
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

COMMENT ON TABLE public.timer_presets IS 'Пресеты таймера: правила лимитов и штрафов (Строгий будний, Выходной).';
COMMENT ON COLUMN public.timer_presets.safe_minutes IS 'Минуты до первого множителя (бесплатные/дешёвые).';
COMMENT ON COLUMN public.timer_presets.base_cost_per_min IS 'Базовая ставка XP за минуту.';
COMMENT ON COLUMN public.timer_presets.penalty_multiplier_x2_after_mins IS 'После N минут — множитель x2. NULL = не используется.';
COMMENT ON COLUMN public.timer_presets.penalty_multiplier_x3_after_mins IS 'После N минут — множитель x3. NULL = не используется.';

-- Примеры пресетов
INSERT INTO public.timer_presets (name, safe_minutes, base_cost_per_min, penalty_multiplier_x2_after_mins, penalty_multiplier_x3_after_mins)
VALUES
  ('Strict Weekday', 60, 1.0, 60, 90),
  ('Weekend Relax', 120, 0.5, NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 2. active_sessions — единственный источник истины для текущей сессии
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

COMMENT ON TABLE public.active_sessions IS 'Активные/приостановленные сессии таймера. Источник истины — переживает перезагрузку страницы.';
COMMENT ON COLUMN public.active_sessions.started_at IS 'Начало текущего сегмента. При active: elapsed = accumulated_seconds + (now - started_at). При paused: null.';
COMMENT ON COLUMN public.active_sessions.accumulated_seconds IS 'Сумма секунд до паузы. При resume не меняется; при pause увеличивается на (now - started_at).';
COMMENT ON COLUMN public.active_sessions.completed_at IS 'Когда сессия завершена (status=completed).';

-- Один активный/приостановленный сеанс на пилота
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_sessions_one_per_user
  ON public.active_sessions (user_id)
  WHERE status IN ('active', 'paused');

-- Быстрый поиск активных сессий
CREATE INDEX IF NOT EXISTS idx_active_sessions_status
  ON public.active_sessions (status)
  WHERE status IN ('active', 'paused');

-- =============================================================================
-- 3. RLS (для анонимного доступа, как в profiles)
-- =============================================================================
ALTER TABLE public.timer_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Пресеты — только чтение
DROP POLICY IF EXISTS "timer_presets_anon_select" ON public.timer_presets;
CREATE POLICY "timer_presets_anon_select"
  ON public.timer_presets FOR SELECT
  USING (true);

-- Сессии — чтение и обновление (для таймера)
DROP POLICY IF EXISTS "active_sessions_anon_select" ON public.active_sessions;
CREATE POLICY "active_sessions_anon_select"
  ON public.active_sessions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "active_sessions_anon_insert" ON public.active_sessions;
CREATE POLICY "active_sessions_anon_insert"
  ON public.active_sessions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "active_sessions_anon_update" ON public.active_sessions;
CREATE POLICY "active_sessions_anon_update"
  ON public.active_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

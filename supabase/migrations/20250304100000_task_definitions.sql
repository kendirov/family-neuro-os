-- Task Definitions: deflationary daily economy (max ~150 pts/day).
-- Source of truth for task schema; completions stored in transactions with task_definition_id.

-- =============================================================================
-- 1. task_definitions — каталог задач с time_block, category, rewards, limits
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.task_definitions (
  id text PRIMARY KEY,
  label text NOT NULL,
  emoji text NOT NULL DEFAULT '✅',
  time_block text NOT NULL CHECK (time_block IN ('morning', 'afternoon', 'evening', 'anytime')),
  category text NOT NULL CHECK (category IN ('routine', 'food', 'school', 'bonus')),
  base_reward integer NOT NULL DEFAULT 0 CHECK (base_reward >= 0),
  bonus_reward integer NOT NULL DEFAULT 0 CHECK (bonus_reward >= 0),
  max_daily_completions integer NOT NULL DEFAULT 1 CHECK (max_daily_completions >= 1),
  reason_template text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.task_definitions IS 'Каталог задач: time_block, category, base/bonus rewards, max_daily_completions. Дефляционная экономика ~100-150 pts/day.';
COMMENT ON COLUMN public.task_definitions.time_block IS 'morning | afternoon | evening | anytime';
COMMENT ON COLUMN public.task_definitions.category IS 'routine | food | school | bonus';
COMMENT ON COLUMN public.task_definitions.base_reward IS 'Базовые очки за выполнение (напр. 5 за "Проснулся вовремя")';
COMMENT ON COLUMN public.task_definitions.bonus_reward IS 'Доп. очки за бонусное условие (напр. +10 за "Съел всё")';
COMMENT ON COLUMN public.task_definitions.max_daily_completions IS 'Макс. выполнений в день (защита от спама)';
COMMENT ON COLUMN public.task_definitions.reason_template IS 'Шаблон для description в transactions';

-- =============================================================================
-- 2. transactions — добавить task_definition_id для привязки к определению
-- =============================================================================
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS task_definition_id text REFERENCES public.task_definitions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.transactions.task_definition_id IS 'FK на task_definitions. Null для burn/spend и legacy.';

CREATE INDEX IF NOT EXISTS idx_transactions_task_definition_id
  ON public.transactions (task_definition_id)
  WHERE task_definition_id IS NOT NULL;

-- =============================================================================
-- 3. RPC: проверка лимита перед начислением (опционально, для строгой валидации)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.check_task_completion_limit(
  p_user_id text,
  p_task_definition_id text,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max int;
  v_count int;
BEGIN
  SELECT max_daily_completions INTO v_max
  FROM public.task_definitions
  WHERE id = p_task_definition_id;

  IF v_max IS NULL THEN
    RETURN true; -- неизвестная задача — пропускаем проверку
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.transactions t
  WHERE t.user_id = p_user_id
    AND t.task_definition_id = p_task_definition_id
    AND t.amount > 0
    AND t.type = 'earn'
    AND (t.created_at AT TIME ZONE 'UTC')::date = p_date;

  RETURN v_count < v_max;
END;
$$;

COMMENT ON FUNCTION public.check_task_completion_limit IS 'Проверка: не превышен ли max_daily_completions для задачи за день. Вызывать перед insert earn-транзакции.';

-- =============================================================================
-- 4. Seed: 14 сбалансированных задач (~150 pts идеальный день)
-- =============================================================================
INSERT INTO public.task_definitions (id, label, emoji, time_block, category, base_reward, bonus_reward, max_daily_completions, reason_template, sort_order)
VALUES
  ('wake_on_time', 'Проснулся вовремя', '⏰', 'morning', 'routine', 5, 0, 1, 'Режим дня: Проснулся вовремя', 10),
  ('make_bed', 'Убрал постель', '🛏', 'morning', 'routine', 5, 0, 1, 'Режим дня: Убрал постель', 20),
  ('teeth_morning', 'Зубы/Умылся', '🦷', 'morning', 'routine', 5, 0, 1, 'Режим дня: Зубы/Умылся', 30),
  ('breakfast', 'Завтрак', '🍳', 'morning', 'food', 10, 5, 1, 'Питание: Завтрак', 40),
  ('lunch', 'Обед', '🍔', 'afternoon', 'food', 10, 5, 1, 'Питание: Обед', 50),
  ('snack', 'Полдник', '🍪', 'afternoon', 'food', 10, 0, 1, 'Питание: Полдник', 55),
  ('dinner', 'Ужин', '🍲', 'evening', 'food', 10, 5, 1, 'Питание: Ужин', 60),
  ('pack_bag', 'Собрал портфель', '🎒', 'morning', 'school', 10, 0, 1, 'Школа: Собрал портфель', 70),
  ('school_leave', 'Ушёл вовремя', '🚪', 'morning', 'school', 10, 0, 1, 'Школа: Ушёл вовремя', 75),
  ('homework_done', 'Сделал уроки', '📚', 'afternoon', 'school', 20, 0, 1, 'Школа: Уроки', 80),
  ('extra_study', 'Доп. занятия / Чтение', '🧠', 'anytime', 'bonus', 0, 10, 1, 'Школа: Доп. занятия', 85),
  ('help_clean', 'Помог с уборкой', '🧹', 'afternoon', 'bonus', 10, 0, 1, 'Дом: Уборка', 90),
  ('take_trash', 'Вынес мусор', '🗑️', 'anytime', 'bonus', 10, 0, 1, 'Дом: Мусор', 95),
  ('sleep_on_time', 'Спать вовремя', '🌙', 'evening', 'routine', 10, 0, 1, 'Сон: Спать вовремя', 100)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  emoji = EXCLUDED.emoji,
  time_block = EXCLUDED.time_block,
  category = EXCLUDED.category,
  base_reward = EXCLUDED.base_reward,
  bonus_reward = EXCLUDED.bonus_reward,
  max_daily_completions = EXCLUDED.max_daily_completions,
  reason_template = EXCLUDED.reason_template,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- 5. RLS
-- =============================================================================
ALTER TABLE public.task_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_definitions_anon_select" ON public.task_definitions;
CREATE POLICY "task_definitions_anon_select"
  ON public.task_definitions FOR SELECT
  USING (true);

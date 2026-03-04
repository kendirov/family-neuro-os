-- =============================================================================
-- ИСПРАВЛЕНИЕ: баллы не сохраняются (ошибка "null value in column id")
-- Причина: колонка id в transactions не имеет DEFAULT, при INSERT без id → ошибка.
-- Запустите в Supabase: Dashboard → SQL Editor → New query → вставьте и Run
-- =============================================================================

-- 1. Добавить DEFAULT для id (если его нет)
ALTER TABLE public.transactions
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 2. Убедиться, что id имеет тип text (если был uuid)
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'id';
  IF col_type = 'uuid' THEN
    ALTER TABLE public.transactions ALTER COLUMN id TYPE text USING id::text;
    ALTER TABLE public.transactions ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Realtime — добавить transactions в publication (если ещё не добавлена)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

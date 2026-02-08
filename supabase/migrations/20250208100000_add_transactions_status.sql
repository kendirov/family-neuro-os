-- Aggregated session logging: one row per gaming session, updated in real time.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS status text;

COMMENT ON COLUMN public.transactions.status IS 'For type=burn: active | completed. Null for legacy rows.';

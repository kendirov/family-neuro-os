-- Turbo-Garage timer foundation v2: server authoritative fields.

ALTER TABLE "screen_time_sessions"
  ADD COLUMN IF NOT EXISTS "planned_end_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "paused_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "total_paused_seconds" bigint NOT NULL DEFAULT 0;

-- Keep accumulated_seconds as charged time (used to compute delta without per-second writes).


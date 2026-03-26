-- Turbo-Garage DB foundation (Prisma 7)
-- Note: UI remains untouched; this is a data-layer schema for future integration.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Enums
-- =========================
DO $$ BEGIN
  CREATE TYPE "FamilyMemberRole" AS ENUM ('ADMIN', 'KID', 'ADULT_USER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EconomyAssetType" AS ENUM ('XP', 'COINS', 'TIME_TOKENS', 'INVENTORY_ITEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EconomyTxType" AS ENUM (
    'XP_EARN',
    'COINS_EARN',
    'COINS_SPEND',
    'TIME_TOKENS_EARN',
    'TIME_TOKENS_SPEND',
    'TIME_TOKENS_EXPIRE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskTemplateTimeBlock" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskTemplateCategory" AS ENUM ('ROUTINE', 'FOOD', 'SCHOOL', 'BONUS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskInstanceStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RewardKind" AS ENUM ('XP', 'COINS', 'TIME_TOKENS', 'INVENTORY_ITEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ScreenTimeActivityType" AS ENUM ('GAME', 'MEDIA_YOUTUBE', 'MEDIA_GOOD');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ScreenTimeSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EconomySourceEntity" AS ENUM ('SYSTEM', 'TASK_INSTANCE', 'REWARD_CATALOG', 'SCREEN_TIME_SESSION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =========================
-- Core families/users
-- =========================
CREATE TABLE IF NOT EXISTS "families" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "timezone" varchar(64) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "display_name" varchar(120),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "family_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "family_id" uuid NOT NULL REFERENCES "families"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "FamilyMemberRole" NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "family_members_family_id_user_id_key" UNIQUE ("family_id","user_id")
);

CREATE INDEX IF NOT EXISTS "idx_family_members_family_id" ON "family_members" ("family_id");

-- =========================
-- Wallet + projections
-- =========================
CREATE TABLE IF NOT EXISTS "wallet_balances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "family_member_id" uuid NOT NULL UNIQUE REFERENCES "family_members"("id") ON DELETE CASCADE,
  "xp_total" bigint NOT NULL DEFAULT 0,
  "coins_balance" bigint NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "wallet_balances_coins_non_negative" CHECK ("coins_balance" >= 0),
  CONSTRAINT "wallet_balances_xp_non_negative" CHECK ("xp_total" >= 0)
);

CREATE INDEX IF NOT EXISTS "idx_wallet_balances_family_member_id" ON "wallet_balances" ("family_member_id");

CREATE TABLE IF NOT EXISTS "daily_user_state" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "family_id" uuid NOT NULL REFERENCES "families"("id") ON DELETE CASCADE,
  "local_date" date NOT NULL,

  "xp_total" bigint NOT NULL DEFAULT 0,
  "level" integer NOT NULL DEFAULT 1,
  "coins_balance" bigint NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "daily_user_state_user_id_local_date_key" UNIQUE ("user_id","local_date")
);

CREATE INDEX IF NOT EXISTS "idx_daily_user_state_family_id_local_date" ON "daily_user_state" ("family_id","local_date");

CREATE TABLE IF NOT EXISTS "screen_time_daily" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "family_id" uuid NOT NULL REFERENCES "families"("id") ON DELETE CASCADE,
  "local_date" date NOT NULL,

  "hard_cap_minutes_per_day" integer NOT NULL,
  "time_tokens_spent_minutes" bigint NOT NULL DEFAULT 0,
  "time_tokens_remaining_minutes" bigint NOT NULL DEFAULT 0,
  "time_tokens_expired_minutes" bigint NOT NULL DEFAULT 0,

  "updated_at" timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "screen_time_daily_user_id_local_date_key" UNIQUE ("user_id","local_date"),
  CONSTRAINT "screen_time_daily_cap_non_negative" CHECK ("hard_cap_minutes_per_day" >= 0),
  CONSTRAINT "screen_time_daily_tokens_non_negative" CHECK (
    "time_tokens_spent_minutes" >= 0 AND
    "time_tokens_remaining_minutes" >= 0 AND
    "time_tokens_expired_minutes" >= 0
  )
);

CREATE INDEX IF NOT EXISTS "idx_screen_time_daily_family_id_local_date" ON "screen_time_daily" ("family_id","local_date");

-- =========================
-- Tasks + rewards + inventory
-- =========================
CREATE TABLE IF NOT EXISTS "task_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "family_id" uuid NOT NULL REFERENCES "families"("id") ON DELETE CASCADE,
  "code" varchar(120) NOT NULL,
  "label" varchar(200) NOT NULL,
  "time_block" "TaskTemplateTimeBlock" NOT NULL,
  "category" "TaskTemplateCategory" NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,

  "xp_reward" bigint NOT NULL DEFAULT 0,
  "coins_reward" bigint NOT NULL DEFAULT 0,
  "time_tokens_reward_minutes" integer NOT NULL DEFAULT 0,

  "meta" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "task_templates_family_id_code_key" UNIQUE ("family_id","code")
);

CREATE INDEX IF NOT EXISTS "idx_task_templates_family_id_time_block_category" ON "task_templates" ("family_id","time_block","category");

CREATE TABLE IF NOT EXISTS "task_instances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "template_id" uuid NOT NULL REFERENCES "task_templates"("id") ON DELETE CASCADE,
  "assignee_member_id" uuid NOT NULL REFERENCES "family_members"("id") ON DELETE CASCADE,
  "local_date" date NOT NULL,

  "status" "TaskInstanceStatus" NOT NULL DEFAULT 'PENDING',
  "assigned_at" timestamptz NOT NULL DEFAULT now(),
  "completed_at" timestamptz,
  "meta" jsonb,

  CONSTRAINT "task_instances_template_id_assignee_member_id_local_date_key"
    UNIQUE ("template_id","assignee_member_id","local_date")
);

CREATE INDEX IF NOT EXISTS "idx_task_instances_assignee_member_id_local_date" ON "task_instances" ("assignee_member_id","local_date");
CREATE INDEX IF NOT EXISTS "idx_task_instances_template_id" ON "task_instances" ("template_id");

CREATE TABLE IF NOT EXISTS "reward_catalog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "family_id" uuid NOT NULL REFERENCES "families"("id") ON DELETE CASCADE,
  "reward_code" varchar(120) NOT NULL,
  "kind" "RewardKind" NOT NULL,

  "asset_type" "EconomyAssetType",
  "amount" bigint,
  "inventory_item_sku" varchar(160),

  "meta" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "reward_catalog_family_id_reward_code_key" UNIQUE ("family_id","reward_code")
);

CREATE INDEX IF NOT EXISTS "idx_reward_catalog_family_id_kind" ON "reward_catalog" ("family_id","kind");

CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "family_id" uuid NOT NULL REFERENCES "families"("id") ON DELETE CASCADE,
  "owner_member_id" uuid NOT NULL REFERENCES "family_members"("id") ON DELETE CASCADE,

  "item_sku" varchar(160) NOT NULL,
  "quantity" bigint NOT NULL DEFAULT 0,
  "meta" jsonb,
  "updated_at" timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "inventory_items_owner_member_id_item_sku_key" UNIQUE ("owner_member_id","item_sku")
);

CREATE INDEX IF NOT EXISTS "idx_inventory_items_family_id_item_sku" ON "inventory_items" ("family_id","item_sku");

-- =========================
-- Screen-time sessions (server sync timer)
-- =========================
CREATE TABLE IF NOT EXISTS "screen_time_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "family_id" uuid NOT NULL REFERENCES "families"("id") ON DELETE CASCADE,
  "child_member_id" uuid NOT NULL REFERENCES "family_members"("id") ON DELETE CASCADE,

  "activity_type" "ScreenTimeActivityType" NOT NULL,
  "status" "ScreenTimeSessionStatus" NOT NULL DEFAULT 'ACTIVE',

  "started_at" timestamptz NOT NULL DEFAULT now(),
  "accumulated_seconds" bigint NOT NULL DEFAULT 0,
  "last_event_at" timestamptz,
  "completed_at" timestamptz,

  "meta" jsonb,

  CONSTRAINT "screen_time_sessions_status_enum_default_check" CHECK ("status" IN ('ACTIVE','PAUSED','COMPLETED'))
);

CREATE INDEX IF NOT EXISTS "idx_screen_time_sessions_family_id_child_member_id_status" ON "screen_time_sessions" ("family_id","child_member_id","status");

-- Critical protection: ONE active timer session per child.
-- Prisma has no native partial unique index support here, so we add raw SQL.
CREATE UNIQUE INDEX IF NOT EXISTS "screen_time_sessions_one_active_per_child"
  ON "screen_time_sessions" ("child_member_id")
  WHERE "status" = 'ACTIVE';

-- =========================
-- Economy ledger (source of truth)
-- =========================
CREATE TABLE IF NOT EXISTS "economy_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  "family_id" uuid NOT NULL REFERENCES "families"("id") ON DELETE CASCADE,
  "subject_member_id" uuid NOT NULL REFERENCES "family_members"("id") ON DELETE CASCADE,

  "asset_type" "EconomyAssetType" NOT NULL,
  "tx_type" "EconomyTxType" NOT NULL,
  "amount" bigint NOT NULL,

  "idempotency_key" varchar(160) UNIQUE,

  "local_date" date,

  "source_entity" "EconomySourceEntity" NOT NULL,
  "source_id" text,

  "task_instance_id" uuid REFERENCES "task_instances"("id") ON DELETE SET NULL,
  "reward_catalog_id" uuid REFERENCES "reward_catalog"("id") ON DELETE SET NULL,
  "screen_time_session_id" uuid REFERENCES "screen_time_sessions"("id") ON DELETE SET NULL,

  "meta" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "economy_transactions_amount_non_negative" CHECK ("amount" >= 0),
  CONSTRAINT "economy_transactions_xp_only_positive" CHECK (("asset_type" <> 'XP'::"EconomyAssetType") OR ("amount" > 0))
);

CREATE INDEX IF NOT EXISTS "idx_economy_transactions_family_subject_created_at" ON "economy_transactions" ("family_id","subject_member_id","created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_economy_transactions_family_asset_local_date" ON "economy_transactions" ("family_id","asset_type","local_date");


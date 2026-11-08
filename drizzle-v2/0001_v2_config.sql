-- v2 Phase 1 — Config tables (banks, categories, card_networks)
-- รันใน Supabase SQL Editor (session pooler) · รันซ้ำได้ (idempotent)
-- ⚠️ ไม่แตะ schema public เลย — สร้างของใหม่ใน schema v2 เท่านั้น

CREATE SCHEMA IF NOT EXISTS v2;

-- ---------- v2.banks ----------
CREATE TABLE IF NOT EXISTS v2.banks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL,
  short_name  text NOT NULL,
  name_th     text NOT NULL,
  name_en     text,
  brand_bg    text NOT NULL DEFAULT '#5F5E5A',
  brand_fg    text NOT NULL DEFAULT '#F1EFE8',
  logo_key    text,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  legacy_id   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT banks_code_unique      UNIQUE (code),
  CONSTRAINT banks_legacy_id_unique UNIQUE (legacy_id)
);
CREATE INDEX IF NOT EXISTS idx_v2_banks_active_sort
  ON v2.banks (is_active, sort_order);

-- ---------- v2.categories ----------
CREATE TABLE IF NOT EXISTS v2.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL,
  name_th     text NOT NULL,
  name_en     text,
  icon        text NOT NULL,
  color_bg    text NOT NULL,
  color_fg    text NOT NULL DEFAULT '#FFFFFF',
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  legacy_id   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_code_unique      UNIQUE (code),
  CONSTRAINT categories_legacy_id_unique UNIQUE (legacy_id)
);
CREATE INDEX IF NOT EXISTS idx_v2_categories_active_sort
  ON v2.categories (is_active, sort_order);

-- ---------- v2.card_networks ----------
CREATE TABLE IF NOT EXISTS v2.card_networks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL,
  name        text NOT NULL,
  logo_key    text,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT card_networks_code_unique UNIQUE (code)
);

-- ---------- RLS ----------
-- app ต่อ DB ด้วย role เจ้าของตาราง (postgres) → bypass RLS เหมือนตารางเดิม
-- เปิด RLS ไว้กัน Data API: อ่านได้อย่างเดียว ไม่มี write policy
-- (schema v2 ไม่ได้ GRANT ให้ anon/authenticated → Data API ยังเข้าไม่ได้อยู่ดี)
ALTER TABLE v2.banks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.card_networks ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['banks', 'categories', 'card_networks'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'v2' AND tablename = t AND policyname = 'read_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "read_all" ON v2.%I FOR SELECT TO authenticated USING (true)', t
      );
    END IF;
  END LOOP;
END $$;

-- ---------- seed: card_networks ----------
INSERT INTO v2.card_networks (code, name, sort_order) VALUES
  ('visa',       'Visa',             1),
  ('mastercard', 'Mastercard',       2),
  ('jcb',        'JCB',              3),
  ('amex',       'American Express', 4),
  ('unionpay',   'UnionPay',         5)
ON CONFLICT (code) DO NOTHING;

-- banks / categories ไม่ seed ที่นี่ → ใช้ src/db/seed-v2-config.ts (ดึงจาก public แบบ SELECT อย่างเดียว)

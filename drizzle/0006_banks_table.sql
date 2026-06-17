-- Migration: สร้างตาราง banks (admin) + seed 13 ธนาคารพาณิชย์ไทย
-- รันใน Supabase SQL Editor (หรือ drizzle-kit migrate ผ่าน session pooler 5432)
--
-- ยังไม่เพิ่ม FK credit_cards.bank_id → banks.id รอบนี้ — ทำใน migration แยกตอน migrate สี
-- ยังไม่เพิ่ม brand_bg / brand_fg รอบนี้ — ใช้ lib/banks.ts ต่อ

CREATE TABLE IF NOT EXISTS public.banks (
  id          text        PRIMARY KEY,
  short_name  text        NOT NULL,
  name        text        NOT NULL,
  active      boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banks_active_sort
  ON public.banks (active, sort_order);

-- seed 13 ธนาคารพาณิชย์ไทย (id ของ 6 แบงก์เดิมคงเดิม)
INSERT INTO public.banks (id, short_name, name, sort_order) VALUES
  ('b-bbl',   'BBL',   'ธนาคารกรุงเทพ',                1),
  ('b-kbank', 'KBank', 'ธนาคารกสิกรไทย',                2),
  ('b-ktb',   'KTB',   'ธนาคารกรุงไทย',                3),
  ('b-ttb',   'TTB',   'ธนาคารทหารไทยธนชาต',           4),
  ('b-scb',   'SCB',   'ธนาคารไทยพาณิชย์',              5),
  ('b-bay',   'BAY',   'ธนาคารกรุงศรีอยุธยา',           6),
  ('b-kkp',   'KKP',   'ธนาคารเกียรตินาคินภัทร',         7),
  ('b-cimbt', 'CIMBT', 'ธนาคารซีไอเอ็มบีไทย',           8),
  ('b-uob',   'UOB',   'ธนาคารยูโอบี',                  9),
  ('b-tisco', 'TISCO', 'ธนาคารทิสโก้',                 10),
  ('b-lhb',   'LHB',   'ธนาคารแลนด์ แอนด์ เฮ้าส์',      11),
  ('b-tcb',   'TCB',   'ธนาคารไทยเครดิต',               12),
  ('b-ktc',   'KTC',   'บัตรกรุงไทย (KTC)',             13)
ON CONFLICT (id) DO NOTHING;

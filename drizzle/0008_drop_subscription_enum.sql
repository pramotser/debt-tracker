-- Migration: ลบค่า SUBSCRIPTION ออกจาก enum ledger_entry_type
-- เหตุผล: /recurring merge fixed-cost + subscription แล้ว (commit 2ed81ff)
--          ไม่มี code path ไหน insert SUBSCRIPTION อีก · DB ก็ไม่มี row เหลือ
-- Postgres ไม่มี ALTER TYPE ... DROP VALUE ต้องสลับ enum
-- ตรวจก่อน: SELECT COUNT(*) FROM ledger_entries WHERE type = 'SUBSCRIPTION'; ต้อง = 0

CREATE TYPE ledger_entry_type_new AS ENUM (
  'FIXED_COST',
  'CREDIT_CARD',
  'CREDIT_CARD_INSTALLMENT',
  'ONE_TIME_COST'
);

ALTER TABLE ledger_entries
  ALTER COLUMN type TYPE ledger_entry_type_new
  USING type::text::ledger_entry_type_new;

DROP TYPE ledger_entry_type;

ALTER TYPE ledger_entry_type_new RENAME TO ledger_entry_type;

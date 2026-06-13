-- Migration: เพิ่ม color ใน credit_cards
-- รันใน Supabase SQL Editor
-- default 'blue' · ค่าคุมฝั่งแอปด้วย CARD_COLORS ใน lib/banks.ts

ALTER TABLE public.credit_cards ADD COLUMN color text NOT NULL DEFAULT 'blue';

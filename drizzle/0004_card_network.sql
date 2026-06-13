-- Migration: เพิ่ม card_network ใน credit_cards
-- รันใน Supabase SQL Editor
-- nullable text — คุมค่าฝั่งแอปด้วย zod enum (visa/mastercard/jcb/amex/unionpay)

ALTER TABLE public.credit_cards ADD COLUMN card_network text;

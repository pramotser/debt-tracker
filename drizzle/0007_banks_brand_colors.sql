-- Migration: เพิ่มคอลัมน์สีให้ banks (brand_bg / brand_fg)
-- รันใน Supabase SQL Editor หรือ drizzle-kit migrate ผ่าน session pooler 5432
--
-- 6 ธนาคารที่มีสีเดิมใน lib/banks.ts → backfill ค่าจริง
-- ที่เหลือใช้ default เทาเข้ม (FALLBACK_BANK) — admin มาตั้งสีเองผ่าน UI

ALTER TABLE public.banks
  ADD COLUMN IF NOT EXISTS brand_bg text NOT NULL DEFAULT '#5F5E5A',
  ADD COLUMN IF NOT EXISTS brand_fg text NOT NULL DEFAULT '#F1EFE8';

UPDATE public.banks SET brand_bg = '#185FA5', brand_fg = '#E6F1FB' WHERE id = 'b-uob';
UPDATE public.banks SET brand_bg = '#1C4DA1', brand_fg = '#E5EDF8' WHERE id = 'b-ttb';
UPDATE public.banks SET brand_bg = '#534AB7', brand_fg = '#EEEDFE' WHERE id = 'b-scb';
UPDATE public.banks SET brand_bg = '#3B6D11', brand_fg = '#EAF3DE' WHERE id = 'b-kbank';
UPDATE public.banks SET brand_bg = '#1A3F66', brand_fg = '#E5ECF3' WHERE id = 'b-kkp';
UPDATE public.banks SET brand_bg = '#0E7C66', brand_fg = '#E1F2EC' WHERE id = 'b-ktc';

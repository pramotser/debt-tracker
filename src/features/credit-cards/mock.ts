import { BANK_LIST } from "@/lib/banks";

import type { Bank, Category } from "./types";

// derive จาก lib/banks.ts (single source) — เก็บ MOCK_BANKS ไว้เพื่อ backward compat
export const MOCK_BANKS: Bank[] = BANK_LIST.map((b) => ({
  id: b.id,
  name: b.label,
}));

export const MOCK_CATEGORIES: Category[] = [
  { id: "c-food", name: "อาหาร" },
  { id: "c-fuel", name: "น้ำมัน" },
  { id: "c-shopping", name: "ช้อปปิ้ง" },
  { id: "c-electronics", name: "อิเล็กทรอนิกส์" },
  { id: "c-furniture", name: "เฟอร์นิเจอร์" },
  { id: "c-travel", name: "ท่องเที่ยว" },
  { id: "c-other", name: "อื่นๆ" },
];

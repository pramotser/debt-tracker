// categories ยังไม่มีตารางใน DB (admin tables มาทีหลัง) → mock list
// MOCK_BANKS ถูกย้ายไป features/cards/mock.ts (เจ้าของบัตรเครดิตอยู่ใน /cards)

import type { Category } from "./types";

export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export const MOCK_CATEGORIES: Category[] = [
  { id: "c-electronics", name: "อิเล็กทรอนิกส์" },
  { id: "c-travel", name: "ท่องเที่ยว" },
  { id: "c-furniture", name: "เฟอร์นิเจอร์" },
  { id: "c-other", name: "อื่นๆ" },
];

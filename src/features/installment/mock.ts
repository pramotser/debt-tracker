// banks + categories ยังไม่มีตารางใน DB (admin tables มาทีหลัง) → mock list

import type { Bank, Category } from "./types";

export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export const MOCK_BANKS: Bank[] = [
  { id: "b-uob", name: "UOB" },
  { id: "b-ttb", name: "TTB" },
  { id: "b-scb", name: "SCB" },
  { id: "b-kbank", name: "KBank" },
  { id: "b-kkp", name: "KKP" },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: "c-electronics", name: "อิเล็กทรอนิกส์" },
  { id: "c-travel", name: "ท่องเที่ยว" },
  { id: "c-furniture", name: "เฟอร์นิเจอร์" },
  { id: "c-other", name: "อื่นๆ" },
];

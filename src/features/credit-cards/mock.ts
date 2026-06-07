import type { Bank, Category } from "./types";

export const MOCK_BANKS: Bank[] = [
  { id: "b-uob", name: "UOB" },
  { id: "b-ttb", name: "TTB" },
  { id: "b-scb", name: "SCB" },
  { id: "b-kbank", name: "KBank" },
  { id: "b-kkp", name: "KKP" },
  { id: "b-ktc", name: "KTC" },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: "c-food", name: "อาหาร" },
  { id: "c-fuel", name: "น้ำมัน" },
  { id: "c-shopping", name: "ช้อปปิ้ง" },
  { id: "c-electronics", name: "อิเล็กทรอนิกส์" },
  { id: "c-furniture", name: "เฟอร์นิเจอร์" },
  { id: "c-travel", name: "ท่องเที่ยว" },
  { id: "c-other", name: "อื่นๆ" },
];

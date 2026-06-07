// categories ยังไม่มีตารางใน DB → mock เป็น list {id, name} ชื่อไทย
// dev user UUID ต้องตรงกับที่ seed ไว้ใน src/db/seed.ts + lib/auth.ts

import type { Category } from "./types";

export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export const MOCK_CATEGORIES: Category[] = [
  { id: "c-loan", name: "เงินกู้" },
  { id: "c-family", name: "ครอบครัว" },
  { id: "c-utility", name: "ค่าน้ำค่าไฟ" },
  { id: "c-other", name: "อื่นๆ" },
];

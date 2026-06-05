// categories ยังไม่มีตารางใน DB → mock list ชื่อไทย
// dev user UUID ต้องตรงกับที่ seed ไว้ใน src/db/seed.ts + lib/auth.ts

import type { Category } from "./types";

export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export const MOCK_CATEGORIES: Category[] = [
  { id: "c-streaming", name: "Streaming" },
  { id: "c-music", name: "Music" },
  { id: "c-software", name: "Software/AI" },
  { id: "c-other", name: "อื่นๆ" },
];

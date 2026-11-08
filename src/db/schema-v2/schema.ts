import { pgSchema } from "drizzle-orm/pg-core";

// Postgres schema `v2` — ตารางระบบใหม่ทั้งหมดอยู่ที่นี่ แยกจาก `public` (ของเดิม รอ terminate)
export const v2 = pgSchema("v2");

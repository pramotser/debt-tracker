// drizzle-kit config — STUB รอบนี้ยังไม่ต่อ DB
// ตอนต่อจริง: drizzle-kit ไม่อ่าน .env.local อัตโนมัติ ต้อง load เอง เช่น
//   import { config } from "dotenv";
//   config({ path: ".env.local" });
// migrate ใช้ session pooler 5432 (DATABASE_URL_MIGRATE)

import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  // dbCredentials: { url: process.env.DATABASE_URL_MIGRATE! },
} satisfies Config;

// drizzle-kit config — โหลด .env.local เอง (drizzle-kit ไม่อ่านอัตโนมัติ)
// migrate ใช้ DIRECT_URL (Session pooler 5432) — runtime ค่อยใช้ DATABASE_URL (6543) แยกกัน

import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config({ path: ".env.local" });

const url = process.env.DIRECT_URL;
if (!url) {
  throw new Error("DIRECT_URL is not set (expected in .env.local)");
}

export default {
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
} satisfies Config;

// drizzle-kit config สำหรับ v2 (schema `v2` แยกจาก public) — ไม่แตะ config เดิม
// ใช้: npx drizzle-kit check --config drizzle.v2.config.ts
// migration ของ v2 เขียนมือใน drizzle-v2/*.sql แล้วรันใน Supabase SQL Editor (convention เดียวกับของเดิม)

import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config({ path: ".env.local" });

const url = process.env.DIRECT_URL;
if (!url) {
  throw new Error("DIRECT_URL is not set (expected in .env.local)");
}

export default {
  schema: "./src/db/schema-v2",
  out: "./drizzle-v2",
  dialect: "postgresql",
  schemaFilter: ["v2"],
  dbCredentials: { url },
} satisfies Config;

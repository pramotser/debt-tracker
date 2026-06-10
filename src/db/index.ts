// DB client (runtime) — Supabase Postgres ผ่าน Transaction pooler 6543
// pooler = pgbouncer → ห้ามใช้ prepared statements (prepare: false)
// connection string อ่านจาก DATABASE_URL ใน .env.local (ห้ามใส่ default หรือ log ค่า)

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set (expected in .env.local)");
}

// pooler = transaction mode → prepare ต้องเป็น false
// max=10: ให้ Promise.all ของหลาย queries ใน page render วิ่งขนานจริง + รับ concurrent GET/POST ได้
// (เดิม max=1 ทำให้ Promise.all queue serial — 4 queries × ~200ms กลายเป็น ~800ms)
// Supabase transaction pooler 6543 รับ connections เยอะอยู่แล้ว, bottleneck คือฝั่ง app pool ไม่ใช่ pooler
const client = postgres(url, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;

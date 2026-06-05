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
const client = postgres(url, { prepare: false });

export const db = drizzle(client, { schema });
export type DB = typeof db;

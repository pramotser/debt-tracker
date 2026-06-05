// DB client — STUB รอบนี้ยังไม่ต่อ DB จริง
// ตอนต่อจริง:
//   import { drizzle } from "drizzle-orm/postgres-js";
//   import postgres from "postgres";
//   const client = postgres(process.env.DATABASE_URL!, { prepare: false }); // pooler 6543
//   export const db = drizzle(client, { schema });
// runtime ใช้ transaction pooler 6543 (pgbouncer=true)
// migrate ใช้ session pooler 5432

export const db = null as unknown as never;

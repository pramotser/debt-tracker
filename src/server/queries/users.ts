import "server-only";

import { desc } from "drizzle-orm";

import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

// admin-only — list ทุก user เรียง created_at desc
// guard ฝั่ง query เพื่อความปลอดภัยซ้อน + page ก็ guard อีกชั้น
export async function listUsers(): Promise<User[]> {
  const me = await getCurrentUser();
  if (me.role !== "admin") throw new Error("Forbidden");
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// Auth source = Supabase Auth (cookie session)
// public.users.id = auth.users.id (FK + trigger sync)
// role อ่านจาก public.users.role
// ทุก server query/action ต้องเรียก getCurrentUser() เพื่อกัน orphan / cross-user read

import { eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { users } from "@/db/schema";

import { createClient } from "./supabase/server";

export type CurrentUser = {
  id: string;
  role: "admin" | "user";
  firstName: string;
  middleName: string | null;
  lastName: string;
};

// cache ต่อ request — ลดการ join role/name ซ้ำ
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const [row] = await db
    .select({
      id: users.id,
      role: users.role,
      firstName: users.firstName,
      middleName: users.middleName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row) {
    // trigger ควรสร้าง row อัตโนมัติ — ถ้าไม่มี = state เพี้ยน
    throw new Error(`Profile not found for auth user ${user.id}`);
  }

  return row;
});

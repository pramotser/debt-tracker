"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "กรุณากรอกชื่อ").max(50),
  middleName: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v ? v : null)),
  lastName: z.string().trim().min(1, "กรุณากรอกนามสกุล").max(50),
});

export type ProfileState = { error?: string; ok?: true } | undefined;

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName") ?? undefined,
    lastName: formData.get("lastName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const user = await getCurrentUser();
  await db
    .update(users)
    .set({
      firstName: parsed.data.firstName,
      middleName: parsed.data.middleName,
      lastName: parsed.data.lastName,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

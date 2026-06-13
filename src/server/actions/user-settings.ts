"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const themeSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

export type ThemeState = { error?: string; ok?: true } | undefined;

export async function updateTheme(theme: string): Promise<ThemeState> {
  const parsed = themeSchema.safeParse({ theme });
  if (!parsed.success) {
    return { error: "ค่าธีมไม่ถูกต้อง" };
  }

  const user = await getCurrentUser();

  const updated = await db
    .update(userSettings)
    .set({ theme: parsed.data.theme, updatedAt: new Date() })
    .where(eq(userSettings.userId, user.id))
    .returning({ id: userSettings.id });

  if (updated.length === 0) {
    await db.insert(userSettings).values({
      userId: user.id,
      theme: parsed.data.theme,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

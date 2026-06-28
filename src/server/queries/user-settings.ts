import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export type UserSettingsView = {
  currency: string;
  language: string;
  theme: string;
  onboardedAt: Date | null;
};

export async function getUserSettings(): Promise<UserSettingsView> {
  const user = await getCurrentUser();

  const [row] = await db
    .select({
      currency: userSettings.currency,
      language: userSettings.language,
      theme: userSettings.theme,
      onboardedAt: userSettings.onboardedAt,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .limit(1);

  if (row) return row;

  // lazy create — auth trigger ไม่ได้สร้าง row ของ user_settings ให้
  const [inserted] = await db
    .insert(userSettings)
    .values({ userId: user.id })
    .returning({
      currency: userSettings.currency,
      language: userSettings.language,
      theme: userSettings.theme,
      onboardedAt: userSettings.onboardedAt,
    });

  return inserted;
}

"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

/**
 * บันทึกว่าผู้ใช้ผ่าน onboarding แล้ว (welcome modal + tour)
 * เซ็ต onboarded_at = now() → รอบหน้าจะไม่เด้งทัวร์อีก (ข้ามทุกเครื่อง เพราะผูกกับบัญชี)
 * ไม่ revalidate layout — ปล่อยให้ทัวร์รอบปัจจุบันเดินต่อได้ลื่น · request ถัดไปอ่านค่าใหม่เอง
 */
export async function markOnboarded(): Promise<void> {
  const user = await getCurrentUser();

  const updated = await db
    .update(userSettings)
    .set({ onboardedAt: new Date(), updatedAt: new Date() })
    .where(eq(userSettings.userId, user.id))
    .returning({ id: userSettings.id });

  // lazy create — เผื่อ row ยังไม่มี (auth trigger ไม่ได้สร้างให้)
  if (updated.length === 0) {
    await db.insert(userSettings).values({
      userId: user.id,
      onboardedAt: new Date(),
    });
  }
}

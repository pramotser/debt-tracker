// Auto-generate รายการประจำ → ledger (ใช้ร่วมกับ manual import และ Vercel Cron)
// idempotent: dedupe ด้วย (sourceType, sourceId, year, month) → รันซ้ำกี่รอบก็ปลอดภัย
// ไม่ revalidate ที่นี่ — ให้ caller (server action) จัดการเอง

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  ledgerEntries,
  recurringTemplates,
  type LedgerEntry,
  type RecurringTemplate,
} from "@/db/schema";

export const RECURRING_SOURCE_TYPE = "recurring_template";

// template "ถึงกำหนด" เดือนนี้ไหม — monthly = ทุกเดือน · yearly = เฉพาะเดือนตรง renewDate
export function isTemplateDueInMonth(
  t: Pick<RecurringTemplate, "active" | "billingCycle" | "renewDate">,
  month: number
): boolean {
  if (!t.active) return false;
  if (t.billingCycle === "yearly") {
    if (!t.renewDate) return false;
    // renewDate = "YYYY-MM-DD" → เทียบเฉพาะเดือน
    if (Number(t.renewDate.split("-")[1]) !== month) return false;
  }
  return true;
}

// insert ledger จาก templates ที่ caller ส่งมา + dedupe ด้วย sourceId
// caller เลือกเองว่าส่ง template ตัวไหน (import = ตามที่ผู้ใช้เลือก · auto = ตาม due)
export async function insertRecurringEntries(
  userId: string,
  templates: RecurringTemplate[],
  year: number,
  month: number
): Promise<LedgerEntry[]> {
  if (templates.length === 0) return [];

  const existing = await db
    .select({ sourceId: ledgerEntries.sourceId })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, userId),
        eq(ledgerEntries.year, year),
        eq(ledgerEntries.month, month),
        eq(ledgerEntries.sourceType, RECURRING_SOURCE_TYPE)
      )
    );
  const existingSourceIds = new Set(
    existing.map((e) => e.sourceId).filter((v): v is string => v !== null)
  );

  const toInsert = templates
    .filter((t) => !existingSourceIds.has(t.id))
    .map((t) => ({
      userId,
      categoryId: t.categoryId,
      sourceType: RECURRING_SOURCE_TYPE,
      sourceId: t.id,
      type: "FIXED_COST" as const,
      name: t.name,
      amount: t.defaultAmount,
      year,
      month,
      paid: false,
    }));

  if (toInsert.length === 0) return [];
  return db.insert(ledgerEntries).values(toInsert).returning();
}

// auto-gen: สร้าง ledger ของรายการประจำที่ถึงกำหนดเดือนนั้นให้ครบ (เคารพ active + cycle)
export async function generateRecurringForMonth(
  userId: string,
  year: number,
  month: number
): Promise<LedgerEntry[]> {
  const templates = await db
    .select()
    .from(recurringTemplates)
    .where(eq(recurringTemplates.userId, userId));
  const due = templates.filter((t) => isTemplateDueInMonth(t, month));
  return insertRecurringEntries(userId, due, year, month);
}

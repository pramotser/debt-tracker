"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  fixedCostTemplates,
  ledgerEntries,
  type LedgerEntry,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const PAGE_PATH = "/fix-cost";

const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "amount must be a number with up to 2 decimals");

const idSchema = z.string().uuid();
const yearSchema = z.number().int().min(1970).max(9999);
const monthSchema = z.number().int().min(1).max(12);

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  categoryId: z.string().trim().min(1),
  amount: amountSchema.nullable(),
  year: yearSchema,
  month: monthSchema,
});

function normalize(s: string) {
  return s.trim().toLocaleLowerCase("th");
}

export async function createLedgerEntry(
  input: z.infer<typeof createSchema>
): Promise<LedgerEntry> {
  const parsed = createSchema.parse(input);
  const user = await getCurrentUser();
  const [row] = await db
    .insert(ledgerEntries)
    .values({
      userId: user.id,
      categoryId: parsed.categoryId,
      sourceType: null,
      sourceId: null,
      type: "ONE_TIME_COST",
      name: parsed.name,
      amount: parsed.amount,
      year: parsed.year,
      month: parsed.month,
      paid: false,
    })
    .returning();
  revalidatePath(PAGE_PATH);
  return row;
}

export async function toggleLedgerEntryPaid(
  id: string,
  paid: boolean
): Promise<LedgerEntry> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  const [row] = await db
    .update(ledgerEntries)
    .set({
      paid,
      paidAt: paid ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(ledgerEntries.id, parsedId), eq(ledgerEntries.userId, user.id))
    )
    .returning();
  if (!row) throw new Error("entry not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function updateLedgerEntryAmount(
  id: string,
  amount: string | null
): Promise<LedgerEntry> {
  const parsedId = idSchema.parse(id);
  const parsedAmount = amount === null ? null : amountSchema.parse(amount);
  const user = await getCurrentUser();
  const [row] = await db
    .update(ledgerEntries)
    .set({ amount: parsedAmount, updatedAt: new Date() })
    .where(
      and(eq(ledgerEntries.id, parsedId), eq(ledgerEntries.userId, user.id))
    )
    .returning();
  if (!row) throw new Error("entry not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function deleteLedgerEntry(id: string): Promise<void> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  await db
    .delete(ledgerEntries)
    .where(
      and(eq(ledgerEntries.id, parsedId), eq(ledgerEntries.userId, user.id))
    );
  revalidatePath(PAGE_PATH);
}

// ดึง template (active=true) เข้าเดือนที่เลือก
// replaceConflicts=true → row เดิมที่ชื่อตรงกัน จะถูก update ด้วยค่าจาก template (category, amount, source)
// replaceConflicts=false → row เดิมไม่ถูกแตะ · เพิ่มเฉพาะ template ที่ยังไม่มีชื่อตรงกัน
export async function pullTemplatesIntoMonth(
  year: number,
  month: number,
  replaceConflicts: boolean
): Promise<{ added: LedgerEntry[]; replacedIds: string[] }> {
  const parsedYear = yearSchema.parse(year);
  const parsedMonth = monthSchema.parse(month);
  const user = await getCurrentUser();

  const [activeTemplates, existing] = await Promise.all([
    db
      .select()
      .from(fixedCostTemplates)
      .where(
        and(
          eq(fixedCostTemplates.userId, user.id),
          eq(fixedCostTemplates.active, true)
        )
      ),
    db
      .select()
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.userId, user.id),
          eq(ledgerEntries.year, parsedYear),
          eq(ledgerEntries.month, parsedMonth)
        )
      ),
  ]);

  const existingByName = new Map(existing.map((e) => [normalize(e.name), e]));
  const toInsert: (typeof ledgerEntries.$inferInsert)[] = [];
  const replaceTargets: { existingId: string; template: typeof activeTemplates[number] }[] = [];

  for (const t of activeTemplates) {
    const match = existingByName.get(normalize(t.name));
    if (match) {
      if (replaceConflicts) {
        replaceTargets.push({ existingId: match.id, template: t });
      }
      continue;
    }
    toInsert.push({
      userId: user.id,
      categoryId: t.categoryId,
      sourceType: "fixed_cost_template",
      sourceId: t.id,
      type: "FIXED_COST",
      name: t.name,
      amount: t.defaultAmount,
      year: parsedYear,
      month: parsedMonth,
      paid: false,
    });
  }

  const result = await db.transaction(async (tx) => {
    const added =
      toInsert.length > 0
        ? await tx.insert(ledgerEntries).values(toInsert).returning()
        : [];

    const replacedIds: string[] = [];
    for (const r of replaceTargets) {
      const [updated] = await tx
        .update(ledgerEntries)
        .set({
          categoryId: r.template.categoryId,
          sourceType: "fixed_cost_template",
          sourceId: r.template.id,
          type: "FIXED_COST",
          name: r.template.name,
          amount: r.template.defaultAmount,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(ledgerEntries.id, r.existingId),
            eq(ledgerEntries.userId, user.id)
          )
        )
        .returning({ id: ledgerEntries.id });
      if (updated) replacedIds.push(updated.id);
    }

    return { added, replacedIds };
  });

  revalidatePath(PAGE_PATH);
  return result;
}

// preview เฉยๆ ไม่แตะ DB — ใช้ตัดสินใจฝั่ง client ว่าควรโชว์ confirm dialog มั้ย
export async function previewPullTemplates(
  year: number,
  month: number
): Promise<{ toAddNames: string[]; conflictNames: string[] }> {
  const parsedYear = yearSchema.parse(year);
  const parsedMonth = monthSchema.parse(month);
  const user = await getCurrentUser();

  const [activeTemplates, existing] = await Promise.all([
    db
      .select({ name: fixedCostTemplates.name })
      .from(fixedCostTemplates)
      .where(
        and(
          eq(fixedCostTemplates.userId, user.id),
          eq(fixedCostTemplates.active, true)
        )
      ),
    db
      .select({ name: ledgerEntries.name })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.userId, user.id),
          eq(ledgerEntries.year, parsedYear),
          eq(ledgerEntries.month, parsedMonth)
        )
      ),
  ]);

  const existingSet = new Set(existing.map((e) => normalize(e.name)));
  const toAddNames: string[] = [];
  const conflictNames: string[] = [];
  for (const t of activeTemplates) {
    if (existingSet.has(normalize(t.name))) conflictNames.push(t.name);
    else toAddNames.push(t.name);
  }
  return { toAddNames, conflictNames };
}


"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  fixedCostTemplates,
  ledgerEntries,
  type LedgerEntry,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const PAGE_PATH = "/monthly-cost";

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

// import template ที่เลือกเข้าเดือนนั้น · skip template ที่มี ledger row อยู่แล้ว (เทียบจาก sourceId)
export async function importFixCostTemplatesToMonth(
  templateIds: string[],
  year: number,
  month: number
): Promise<LedgerEntry[]> {
  const parsedIds = z.array(idSchema).min(1).parse(templateIds);
  const parsedYear = yearSchema.parse(year);
  const parsedMonth = monthSchema.parse(month);
  const user = await getCurrentUser();

  const [templates, existing] = await Promise.all([
    db
      .select()
      .from(fixedCostTemplates)
      .where(
        and(
          eq(fixedCostTemplates.userId, user.id),
          inArray(fixedCostTemplates.id, parsedIds)
        )
      ),
    db
      .select({ sourceId: ledgerEntries.sourceId })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.userId, user.id),
          eq(ledgerEntries.year, parsedYear),
          eq(ledgerEntries.month, parsedMonth),
          eq(ledgerEntries.type, "FIXED_COST"),
          eq(ledgerEntries.sourceType, "fixed_cost_template")
        )
      ),
  ]);

  const existingSourceIds = new Set(
    existing.map((e) => e.sourceId).filter((v): v is string => v !== null)
  );

  const toInsert = templates
    .filter((t) => !existingSourceIds.has(t.id))
    .map((t) => ({
      userId: user.id,
      categoryId: t.categoryId,
      sourceType: "fixed_cost_template",
      sourceId: t.id,
      type: "FIXED_COST" as const,
      name: t.name,
      amount: t.defaultAmount,
      year: parsedYear,
      month: parsedMonth,
      paid: false,
    }));

  if (toInsert.length === 0) {
    revalidatePath(PAGE_PATH);
    return [];
  }

  const added = await db.insert(ledgerEntries).values(toInsert).returning();
  revalidatePath(PAGE_PATH);
  return added;
}

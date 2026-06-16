"use server";

import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  ledgerEntries,
  recurringTemplates,
  type LedgerEntry,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const PAGE_PATH = "/recurring";
const SOURCE_TYPE = "recurring_template";

// scope ของหน้านี้ = ทั้ง template-imported (FIXED_COST + source=recurring_template)
// และ ad-hoc one-time entry (ONE_TIME_COST + source=null)
const pageScope = or(
  and(
    eq(ledgerEntries.type, "FIXED_COST"),
    eq(ledgerEntries.sourceType, SOURCE_TYPE)
  ),
  and(
    eq(ledgerEntries.type, "ONE_TIME_COST"),
    isNull(ledgerEntries.sourceType)
  )
);

const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "amount must be a number with up to 2 decimals");

const nameSchema = z.string().trim().min(1).max(120);
const categoryIdSchema = z.string().trim().min(1);
const idSchema = z.string().uuid();
const yearSchema = z.number().int().min(1970).max(9999);
const monthSchema = z.number().int().min(1).max(12);

export async function toggleRecurringPaid(
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
      and(
        eq(ledgerEntries.id, parsedId),
        eq(ledgerEntries.userId, user.id),
        pageScope
      )
    )
    .returning();
  if (!row) throw new Error("entry not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function updateRecurringAmount(
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
      and(
        eq(ledgerEntries.id, parsedId),
        eq(ledgerEntries.userId, user.id),
        pageScope
      )
    )
    .returning();
  if (!row) throw new Error("entry not found");
  revalidatePath(PAGE_PATH);
  return row;
}

// client เรียกตอนเปลี่ยนเดือน — ไม่ revalidate (client เก็บ cache เอง)
export async function fetchRecurringEntriesByMonth(
  year: number,
  month: number
): Promise<LedgerEntry[]> {
  const parsedYear = yearSchema.parse(year);
  const parsedMonth = monthSchema.parse(month);
  const user = await getCurrentUser();
  return db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.year, parsedYear),
        eq(ledgerEntries.month, parsedMonth),
        pageScope
      )
    )
    .orderBy(asc(ledgerEntries.createdAt));
}

export async function deleteRecurringLedger(id: string): Promise<void> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  await db
    .delete(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.id, parsedId),
        eq(ledgerEntries.userId, user.id),
        pageScope
      )
    );
  revalidatePath(PAGE_PATH);
}

export async function createOneTimeEntry(input: {
  name: string;
  categoryId: string;
  amount: string | null;
  year: number;
  month: number;
}): Promise<LedgerEntry> {
  const parsedName = nameSchema.parse(input.name);
  const parsedCategoryId = categoryIdSchema.parse(input.categoryId);
  const parsedAmount =
    input.amount === null ? null : amountSchema.parse(input.amount);
  const parsedYear = yearSchema.parse(input.year);
  const parsedMonth = monthSchema.parse(input.month);
  const user = await getCurrentUser();
  const [row] = await db
    .insert(ledgerEntries)
    .values({
      userId: user.id,
      categoryId: parsedCategoryId,
      sourceType: null,
      sourceId: null,
      type: "ONE_TIME_COST",
      name: parsedName,
      amount: parsedAmount,
      year: parsedYear,
      month: parsedMonth,
      paid: false,
    })
    .returning();
  if (!row) throw new Error("insert failed");
  revalidatePath(PAGE_PATH);
  return row;
}

// import template ที่เลือกเข้าเดือนนั้น · ทุก row ลง type=FIXED_COST + source_type='recurring_template'
// กันดึงซ้ำ: เช็คก่อนว่า (source_type, source_id, year, month) มีอยู่หรือยัง
export async function importRecurringToMonth(
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
      .from(recurringTemplates)
      .where(
        and(
          eq(recurringTemplates.userId, user.id),
          inArray(recurringTemplates.id, parsedIds)
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
          eq(ledgerEntries.sourceType, SOURCE_TYPE)
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
      sourceType: SOURCE_TYPE,
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

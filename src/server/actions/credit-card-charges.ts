"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { ledgerEntries, type LedgerEntry } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const PAGE_PATH = "/cards";

const idSchema = z.string().uuid();
const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "amount must be a number with up to 2 decimals");

const createChargeSchema = z.object({
  cardId: z.string().uuid(),
  categoryId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  amount: amountSchema,
  year: z.number().int().min(1970).max(9999),
  month: z.number().int().min(1).max(12),
});

// one-time charge ลงบัตรเครดิต (type=CREDIT_CARD)
// source_type='credit_card', source_id=card.id
export async function createCreditCardCharge(
  input: z.infer<typeof createChargeSchema>
): Promise<LedgerEntry> {
  const parsed = createChargeSchema.parse(input);
  const user = await getCurrentUser();
  const [row] = await db
    .insert(ledgerEntries)
    .values({
      userId: user.id,
      categoryId: parsed.categoryId,
      sourceType: "credit_card",
      sourceId: parsed.cardId,
      type: "CREDIT_CARD",
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

export async function toggleCreditCardChargePaid(
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
        eq(ledgerEntries.type, "CREDIT_CARD")
      )
    )
    .returning();
  if (!row) throw new Error("entry not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function updateCreditCardChargeAmount(
  id: string,
  amount: string
): Promise<LedgerEntry> {
  const parsedId = idSchema.parse(id);
  const parsedAmount = amountSchema.parse(amount);
  const user = await getCurrentUser();
  const [row] = await db
    .update(ledgerEntries)
    .set({ amount: parsedAmount, updatedAt: new Date() })
    .where(
      and(
        eq(ledgerEntries.id, parsedId),
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.type, "CREDIT_CARD")
      )
    )
    .returning();
  if (!row) throw new Error("entry not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function deleteCreditCardCharge(id: string): Promise<void> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  await db
    .delete(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.id, parsedId),
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.type, "CREDIT_CARD")
      )
    );
  revalidatePath(PAGE_PATH);
}

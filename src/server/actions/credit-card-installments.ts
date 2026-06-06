"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  creditCardInstallments,
  type CreditCardInstallment,
  ledgerEntries,
  type LedgerEntry,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const PAGE_PATH = "/installment";

const idSchema = z.string().uuid();
const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "amount must be a number with up to 2 decimals");

const createPlanSchema = z.object({
  creditCardId: z.string().uuid(),
  categoryId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  totalAmount: amountSchema,
  installmentAmount: amountSchema,
  installmentPrincipal: amountSchema.nullable(),
  installmentInterest: amountSchema.nullable(),
  totalInstallments: z.number().int().min(1).max(120),
  startYear: z.number().int().min(1970).max(9999),
  startMonth: z.number().int().min(1).max(12),
  hasInterest: z.boolean(),
});

function nextYm(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

// Create plan + generate N ledger rows in one transaction
export async function createInstallmentPlan(
  input: z.infer<typeof createPlanSchema>
): Promise<{ plan: CreditCardInstallment; entries: LedgerEntry[] }> {
  const parsed = createPlanSchema.parse(input);
  const user = await getCurrentUser();

  return db.transaction(async (tx) => {
    const [plan] = await tx
      .insert(creditCardInstallments)
      .values({
        userId: user.id,
        creditCardId: parsed.creditCardId,
        categoryId: parsed.categoryId,
        name: parsed.name,
        totalAmount: parsed.totalAmount,
        installmentAmount: parsed.installmentAmount,
        installmentPrincipal: parsed.installmentPrincipal,
        installmentInterest: parsed.installmentInterest,
        totalInstallments: parsed.totalInstallments,
        startYear: parsed.startYear,
        startMonth: parsed.startMonth,
        hasInterest: parsed.hasInterest,
      })
      .returning();

    const rows: (typeof ledgerEntries.$inferInsert)[] = [];
    let y = parsed.startYear;
    let m = parsed.startMonth;
    for (let i = 0; i < parsed.totalInstallments; i += 1) {
      rows.push({
        userId: user.id,
        categoryId: parsed.categoryId,
        sourceType: "credit_card_installment",
        sourceId: plan.id,
        type: "CREDIT_CARD_INSTALLMENT",
        name: parsed.name,
        amount: parsed.installmentAmount,
        principalAmount: parsed.installmentPrincipal,
        interestAmount: parsed.installmentInterest,
        year: y,
        month: m,
        paid: false,
      });
      ({ year: y, month: m } = nextYm(y, m));
    }

    const entries = await tx.insert(ledgerEntries).values(rows).returning();
    revalidatePath(PAGE_PATH);
    return { plan, entries };
  });
}

export async function toggleInstallmentLedgerPaid(
  ledgerId: string,
  paid: boolean
): Promise<LedgerEntry> {
  const parsedId = idSchema.parse(ledgerId);
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
        eq(ledgerEntries.type, "CREDIT_CARD_INSTALLMENT")
      )
    )
    .returning();
  if (!row) throw new Error("entry not found");
  revalidatePath(PAGE_PATH);
  return row;
}

// อัพเดท principal/interest ของงวด (mode 3 — ตอนบิลมา)
// amount = principal + interest (lock invariant)
export async function updateLedgerInterestSplit(
  ledgerId: string,
  principal: string,
  interest: string
): Promise<LedgerEntry> {
  const parsedId = idSchema.parse(ledgerId);
  const p = amountSchema.parse(principal);
  const i = amountSchema.parse(interest);
  const total = (Number(p) + Number(i)).toFixed(2);
  const user = await getCurrentUser();
  const [row] = await db
    .update(ledgerEntries)
    .set({
      principalAmount: p,
      interestAmount: i,
      amount: total,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(ledgerEntries.id, parsedId),
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.type, "CREDIT_CARD_INSTALLMENT")
      )
    )
    .returning();
  if (!row) throw new Error("entry not found");
  revalidatePath(PAGE_PATH);
  return row;
}

// Settle early — delete unpaid rows + insert 1 settlement row + flip plan status
export async function settleInstallmentEarly(
  planId: string,
  settlementAmount: string,
  closeYear: number,
  closeMonth: number
): Promise<void> {
  const parsedPlanId = idSchema.parse(planId);
  const amt = amountSchema.parse(settlementAmount);
  const cy = z.number().int().min(1970).max(9999).parse(closeYear);
  const cm = z.number().int().min(1).max(12).parse(closeMonth);
  const user = await getCurrentUser();

  await db.transaction(async (tx) => {
    const [plan] = await tx
      .select()
      .from(creditCardInstallments)
      .where(
        and(
          eq(creditCardInstallments.id, parsedPlanId),
          eq(creditCardInstallments.userId, user.id)
        )
      );
    if (!plan) throw new Error("plan not found");

    // ลบ row ที่ยังไม่จ่ายของ plan นี้
    await tx
      .delete(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.userId, user.id),
          eq(ledgerEntries.type, "CREDIT_CARD_INSTALLMENT"),
          eq(ledgerEntries.sourceId, parsedPlanId),
          eq(ledgerEntries.paid, false)
        )
      );

    // insert settlement row
    await tx.insert(ledgerEntries).values({
      userId: user.id,
      categoryId: plan.categoryId,
      sourceType: "credit_card_installment",
      sourceId: parsedPlanId,
      type: "CREDIT_CARD_INSTALLMENT",
      name: plan.name,
      amount: amt,
      year: cy,
      month: cm,
      paid: true,
      paidAt: new Date(),
      note: "ปิดก่อนกำหนด",
    });

    await tx
      .update(creditCardInstallments)
      .set({
        status: "early_settled",
        settlementAmount: amt,
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(creditCardInstallments.id, parsedPlanId));
  });

  revalidatePath(PAGE_PATH);
}

// ลบ plan + ลบ ledger row ที่ยังไม่จ่ายเท่านั้น · paid rows ถูก orphan (sourceId แต่ไม่มี plan)
export async function deleteInstallmentPlan(planId: string): Promise<void> {
  const parsedPlanId = idSchema.parse(planId);
  const user = await getCurrentUser();

  await db.transaction(async (tx) => {
    await tx
      .delete(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.userId, user.id),
          eq(ledgerEntries.type, "CREDIT_CARD_INSTALLMENT"),
          eq(ledgerEntries.sourceId, parsedPlanId),
          eq(ledgerEntries.paid, false)
        )
      );

    await tx
      .delete(creditCardInstallments)
      .where(
        and(
          eq(creditCardInstallments.id, parsedPlanId),
          eq(creditCardInstallments.userId, user.id)
        )
      );
  });

  revalidatePath(PAGE_PATH);
}

import "server-only";

import { and, asc, desc, eq, getTableColumns, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  creditCardInstallments,
  type CreditCardInstallment,
  ledgerEntries,
  type LedgerEntry,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export type InstallmentPlanWithProgress = CreditCardInstallment & {
  paidCount: number;
};

export async function listInstallmentPlans(): Promise<
  InstallmentPlanWithProgress[]
> {
  const user = await getCurrentUser();
  const rows = await db
    .select({
      ...getTableColumns(creditCardInstallments),
      paidCount: sql<number>`COALESCE(SUM(CASE WHEN ${ledgerEntries.paid} THEN 1 ELSE 0 END), 0)::int`,
    })
    .from(creditCardInstallments)
    .leftJoin(
      ledgerEntries,
      and(
        eq(ledgerEntries.sourceId, sql`${creditCardInstallments.id}::text`),
        eq(ledgerEntries.type, "CREDIT_CARD_INSTALLMENT")
      )
    )
    .where(eq(creditCardInstallments.userId, user.id))
    .groupBy(creditCardInstallments.id)
    .orderBy(desc(creditCardInstallments.createdAt));
  return rows;
}

// งวดทั้งหมดของ plan หนึ่งๆ (เรียงตามเดือน)
export async function listLedgerForPlan(planId: string): Promise<LedgerEntry[]> {
  const user = await getCurrentUser();
  return db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.type, "CREDIT_CARD_INSTALLMENT"),
        eq(ledgerEntries.sourceId, planId)
      )
    )
    .orderBy(asc(ledgerEntries.year), asc(ledgerEntries.month));
}

// ทุก ledger row ของ user ที่เป็น installment (ใช้ใน UI client-side filter)
export async function listAllInstallmentEntries(): Promise<LedgerEntry[]> {
  const user = await getCurrentUser();
  return db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.type, "CREDIT_CARD_INSTALLMENT")
      )
    )
    .orderBy(asc(ledgerEntries.year), asc(ledgerEntries.month));
}

// "งวดที่จะถึง" — unpaid CREDIT_CARD_INSTALLMENT, sorted by ym, limit
export async function listUpcomingInstallments(
  limit = 5
): Promise<LedgerEntry[]> {
  const user = await getCurrentUser();
  return db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.type, "CREDIT_CARD_INSTALLMENT"),
        eq(ledgerEntries.paid, false)
      )
    )
    .orderBy(asc(ledgerEntries.year), asc(ledgerEntries.month))
    .limit(limit);
}

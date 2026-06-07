import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { ledgerEntries, type LedgerEntry } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

// ledger ของบัตรเครดิตทุกแบบในเดือนนี้ (CREDIT_CARD + CREDIT_CARD_INSTALLMENT)
export async function listCreditCardLedgerByMonth(
  year: number,
  month: number
): Promise<LedgerEntry[]> {
  const user = await getCurrentUser();
  return db
    .select()
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.year, year),
        eq(ledgerEntries.month, month),
        inArray(ledgerEntries.type, ["CREDIT_CARD", "CREDIT_CARD_INSTALLMENT"])
      )
    )
    .orderBy(asc(ledgerEntries.createdAt));
}

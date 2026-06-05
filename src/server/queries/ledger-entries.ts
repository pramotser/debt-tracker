import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { ledgerEntries, type LedgerEntry } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function listEntriesByMonth(
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
        eq(ledgerEntries.month, month)
      )
    )
    .orderBy(asc(ledgerEntries.createdAt));
}

export async function listSubscriptionEntriesByMonth(
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
        eq(ledgerEntries.type, "SUBSCRIPTION")
      )
    )
    .orderBy(asc(ledgerEntries.createdAt));
}

import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

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

export async function listFixCostEntriesByMonth(
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
        inArray(ledgerEntries.type, ["FIXED_COST", "ONE_TIME_COST"])
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

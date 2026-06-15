import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { ledgerEntries, type LedgerEntry } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

// รายการประจำ — ลงเป็น FIXED_COST + source_type='recurring_template'
export async function listRecurringEntriesByMonth(
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
        eq(ledgerEntries.type, "FIXED_COST"),
        eq(ledgerEntries.sourceType, "recurring_template")
      )
    )
    .orderBy(asc(ledgerEntries.createdAt));
}

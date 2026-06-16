import "server-only";

import { and, asc, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { ledgerEntries, type LedgerEntry } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

// รายการในหน้า /recurring = template-imported + ad-hoc one-time entry
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
        or(
          and(
            eq(ledgerEntries.type, "FIXED_COST"),
            eq(ledgerEntries.sourceType, "recurring_template")
          ),
          and(
            eq(ledgerEntries.type, "ONE_TIME_COST"),
            isNull(ledgerEntries.sourceType)
          )
        )
      )
    )
    .orderBy(asc(ledgerEntries.createdAt));
}

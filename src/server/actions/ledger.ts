"use server";

import { z } from "zod";

import { LEDGER_ENTRY_TYPES } from "@/db/schema";
import {
  listAllLedgerEntries,
  type LedgerCursor,
  type LedgerPage,
  type ListAllLedgerEntriesFilters,
} from "@/server/queries/ledger-entries";

const filtersSchema = z.object({
  year: z.number().int().min(1970).max(9999),
  month: z.number().int().min(1).max(12).nullable(),
  types: z.array(z.enum(LEDGER_ENTRY_TYPES)).optional(),
  categoryIds: z.array(z.string()).optional(),
  paid: z.boolean().nullable().optional(),
  q: z.string().optional(),
});

const cursorSchema = z.object({
  year: z.number().int(),
  month: z.number().int(),
  createdAt: z.string(),
  id: z.string().uuid(),
});

// โหลดหน้าถัดไปของ /ledger — เรียกจาก client component
// คงเดิมว่า query กรอง userId เองผ่าน getCurrentUser()
export async function fetchMoreLedgerEntries(
  rawFilters: ListAllLedgerEntriesFilters,
  rawCursor: LedgerCursor,
  limit = 50
): Promise<LedgerPage> {
  const filters = filtersSchema.parse(rawFilters);
  const cursor = cursorSchema.parse(rawCursor);
  return listAllLedgerEntries(filters, cursor, limit);
}

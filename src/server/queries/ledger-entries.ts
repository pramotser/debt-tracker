import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import {
  ledgerEntries,
  type LedgerEntry,
  type LedgerEntryType,
} from "@/db/schema";
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

// /ledger — รวม entry ทุกประเภทของ user ตาม filter
// month === null = ทั้งปี (filter ด้วย year อย่างเดียว)
// types/categoryIds undefined หรือว่าง = ไม่กรอง
// paid null = ทั้งหมด
// q = name ILIKE
export type ListAllLedgerEntriesFilters = {
  year: number;
  month: number | null;
  types?: LedgerEntryType[];
  categoryIds?: string[];
  paid?: boolean | null;
  q?: string;
};

// cursor หน้าถัดไป — ลำดับเดียวกับ orderBy (year, month, createdAt, id)
export type LedgerCursor = {
  year: number;
  month: number;
  createdAt: string; // ISO — serialize ผ่าน Server Action ได้
  id: string;
};

export type LedgerPage = {
  items: LedgerEntry[];
  nextCursor: LedgerCursor | null;
};

// ดึงหนึ่งหน้า · limit = items per page · ส่ง cursor=null สำหรับหน้าแรก
export async function listAllLedgerEntries(
  filters: ListAllLedgerEntriesFilters,
  cursor: LedgerCursor | null = null,
  limit = 50
): Promise<LedgerPage> {
  const user = await getCurrentUser();

  const conds: SQL[] = [
    eq(ledgerEntries.userId, user.id),
    eq(ledgerEntries.year, filters.year),
  ];
  if (filters.month !== null) {
    conds.push(eq(ledgerEntries.month, filters.month));
  }
  if (filters.types && filters.types.length > 0) {
    conds.push(inArray(ledgerEntries.type, filters.types));
  }
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    conds.push(inArray(ledgerEntries.categoryId, filters.categoryIds));
  }
  if (filters.paid === true || filters.paid === false) {
    conds.push(eq(ledgerEntries.paid, filters.paid));
  }
  const trimmed = filters.q?.trim();
  if (trimmed) {
    conds.push(ilike(ledgerEntries.name, `%${trimmed}%`));
  }
  // Postgres row tuple compare — lexicographic เทียบตรงกับ orderBy
  // cursor.createdAt = ISO string · cursor.id = uuid string → cast ให้ตรง type ของ column
  if (cursor) {
    conds.push(
      sql`(${ledgerEntries.year}, ${ledgerEntries.month}, ${ledgerEntries.createdAt}, ${ledgerEntries.id})
          < (${cursor.year}, ${cursor.month}, ${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)`
    );
  }

  // ขอเกิน 1 row เพื่อรู้ว่ามีหน้าต่อไปไหม
  const rows = await db
    .select()
    .from(ledgerEntries)
    .where(and(...conds))
    .orderBy(
      desc(ledgerEntries.year),
      desc(ledgerEntries.month),
      desc(ledgerEntries.createdAt),
      desc(ledgerEntries.id)
    )
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor: LedgerCursor | null =
    hasMore && last
      ? {
          year: last.year,
          month: last.month,
          createdAt: last.createdAt.toISOString(),
          id: last.id,
        }
      : null;

  return { items, nextCursor };
}

// aggregate สำหรับ summary card — เร็วเพราะ scan ครั้งเดียวด้วย index ตัวเดียวกัน
export type LedgerSummary = {
  totalAmount: number;
  paidAmount: number;
  totalCount: number;
  paidCount: number;
};

export async function getLedgerSummary(
  filters: ListAllLedgerEntriesFilters
): Promise<LedgerSummary> {
  const user = await getCurrentUser();

  const conds: SQL[] = [
    eq(ledgerEntries.userId, user.id),
    eq(ledgerEntries.year, filters.year),
  ];
  if (filters.month !== null) {
    conds.push(eq(ledgerEntries.month, filters.month));
  }
  if (filters.types && filters.types.length > 0) {
    conds.push(inArray(ledgerEntries.type, filters.types));
  }
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    conds.push(inArray(ledgerEntries.categoryId, filters.categoryIds));
  }
  if (filters.paid === true || filters.paid === false) {
    conds.push(eq(ledgerEntries.paid, filters.paid));
  }
  const trimmed = filters.q?.trim();
  if (trimmed) {
    conds.push(ilike(ledgerEntries.name, `%${trimmed}%`));
  }

  const [row] = await db
    .select({
      totalAmount: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)::text`,
      paidAmount: sql<string>`COALESCE(SUM(${ledgerEntries.amount}) FILTER (WHERE ${ledgerEntries.paid} = true), 0)::text`,
      totalCount: sql<number>`COUNT(*)::int`,
      paidCount: sql<number>`COUNT(*) FILTER (WHERE ${ledgerEntries.paid} = true)::int`,
    })
    .from(ledgerEntries)
    .where(and(...conds));

  return {
    totalAmount: Number(row?.totalAmount ?? 0),
    paidAmount: Number(row?.paidAmount ?? 0),
    totalCount: row?.totalCount ?? 0,
    paidCount: row?.paidCount ?? 0,
  };
}

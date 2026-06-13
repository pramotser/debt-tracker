import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  creditCardInstallments,
  creditCards,
  ledgerEntries,
  type LedgerEntryType,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { shiftMonth } from "@/lib/month";

// =============================================================================
// /dashboard queries — ทุกฟังก์ชันกรอง userId ผ่าน getCurrentUser() ตาม CLAUDE.md
// numeric ของ Postgres → drizzle คืน string ต้อง cast Number() ก่อนส่งออก
// =============================================================================

// -----------------------------------------------------------------------------
// 2.1 เดือนนี้ต้องจ่ายอะไรบ้าง — KPI สรุปยอด
// -----------------------------------------------------------------------------
export type ThisMonthSummary = {
  total: number;
  paid: number;
  due: number;
  naCount: number;
  entryCount: number;
};

export async function getThisMonthSummary(
  year: number,
  month: number
): Promise<ThisMonthSummary> {
  const user = await getCurrentUser();

  const [row] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
      paid: sql<string>`COALESCE(SUM(CASE WHEN ${ledgerEntries.paid} THEN ${ledgerEntries.amount} ELSE 0 END), 0)`,
      naCount: sql<number>`COUNT(*) FILTER (WHERE ${ledgerEntries.amount} IS NULL)::int`,
      entryCount: sql<number>`COUNT(*)::int`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.year, year),
        eq(ledgerEntries.month, month)
      )
    );

  const total = Number(row?.total ?? 0);
  const paid = Number(row?.paid ?? 0);

  return {
    total,
    paid,
    due: Math.max(0, total - paid),
    naCount: row?.naCount ?? 0,
    entryCount: row?.entryCount ?? 0,
  };
}

// -----------------------------------------------------------------------------
// 2.2 ย้อนหลัง n เดือน รวมเดือนปัจจุบัน
// -----------------------------------------------------------------------------
export type MonthTotal = {
  year: number;
  month: number;
  total: number;
};

function buildMonthRange(
  endYear: number,
  endMonth: number,
  n: number,
  direction: "backward" | "forward"
): { year: number; month: number }[] {
  if (direction === "backward") {
    return Array.from({ length: n }, (_, i) =>
      shiftMonth({ year: endYear, month: endMonth }, -(n - 1 - i))
    );
  }
  // forward = เริ่มเดือนถัดไป (ไม่รวมเดือนอ้างอิง) ไป n เดือน
  return Array.from({ length: n }, (_, i) =>
    shiftMonth({ year: endYear, month: endMonth }, i + 1)
  );
}

async function sumByMonthInRange(
  userId: string,
  months: { year: number; month: number }[]
): Promise<MonthTotal[]> {
  if (months.length === 0) return [];
  const keys = months.map((m) => m.year * 100 + m.month);
  const startKey = Math.min(...keys);
  const endKey = Math.max(...keys);

  const rows = await db
    .select({
      year: ledgerEntries.year,
      month: ledgerEntries.month,
      total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, userId),
        sql`${ledgerEntries.year} * 100 + ${ledgerEntries.month} BETWEEN ${startKey} AND ${endKey}`
      )
    )
    .groupBy(ledgerEntries.year, ledgerEntries.month);

  const totalsByKey = new Map(
    rows.map((r) => [r.year * 100 + r.month, Number(r.total)])
  );

  return months.map((m) => ({
    year: m.year,
    month: m.month,
    total: totalsByKey.get(m.year * 100 + m.month) ?? 0,
  }));
}

export async function getTrailingTotals(
  year: number,
  month: number,
  n = 6
): Promise<MonthTotal[]> {
  const user = await getCurrentUser();
  const months = buildMonthRange(year, month, n, "backward");
  return sumByMonthInRange(user.id, months);
}

// -----------------------------------------------------------------------------
// 2.3 ไปข้างหน้า n เดือน (ไม่รวมเดือนอ้างอิง) ไว้ใช้ทั้ง bar "เดือนข้างหน้า"
// -----------------------------------------------------------------------------
export async function getUpcomingTotals(
  year: number,
  month: number,
  n = 6
): Promise<MonthTotal[]> {
  const user = await getCurrentUser();
  const months = buildMonthRange(year, month, n, "forward");
  return sumByMonthInRange(user.id, months);
}

// -----------------------------------------------------------------------------
// 2.4 รายจ่ายแยกตามประเภท (donut) — สรุปทั้งหมดของ user
// -----------------------------------------------------------------------------
export type TypeBreakdownItem = {
  type: LedgerEntryType;
  total: number;
};

export async function getTypeBreakdown(): Promise<TypeBreakdownItem[]> {
  const user = await getCurrentUser();
  const rows = await db
    .select({
      type: ledgerEntries.type,
      total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, user.id))
    .groupBy(ledgerEntries.type);

  return rows
    .map((r) => ({ type: r.type, total: Number(r.total) }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
}

export async function getTypeBreakdownByMonth(
  year: number,
  month: number
): Promise<TypeBreakdownItem[]> {
  const user = await getCurrentUser();
  const rows = await db
    .select({
      type: ledgerEntries.type,
      total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.year, year),
        eq(ledgerEntries.month, month)
      )
    )
    .groupBy(ledgerEntries.type);

  return rows
    .map((r) => ({ type: r.type, total: Number(r.total) }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
}

// -----------------------------------------------------------------------------
// 2.5 เงินไหลไปหมวดไหน (เรียงมาก→น้อย) — รวมทุกเดือน
// -----------------------------------------------------------------------------
export type CategoryFlowItem = {
  categoryId: string;
  total: number;
};

export async function getCategoryFlow(): Promise<CategoryFlowItem[]> {
  const user = await getCurrentUser();
  const rows = await db
    .select({
      categoryId: ledgerEntries.categoryId,
      total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, user.id))
    .groupBy(ledgerEntries.categoryId)
    .orderBy(desc(sql`COALESCE(SUM(${ledgerEntries.amount}), 0)`));

  return rows
    .map((r) => ({ categoryId: r.categoryId, total: Number(r.total) }))
    .filter((r) => r.total > 0);
}

// -----------------------------------------------------------------------------
// 2.6 ความคืบหน้าแผนผ่อน (active only)
// -----------------------------------------------------------------------------
export type InstallmentProgressItem = {
  id: string;
  name: string;
  cardName: string;
  installmentAmount: number;
  totalInstallments: number;
  paidCount: number;
  remaining: number;
};

export async function getInstallmentProgress(): Promise<
  InstallmentProgressItem[]
> {
  const user = await getCurrentUser();
  const rows = await db
    .select({
      id: creditCardInstallments.id,
      name: creditCardInstallments.name,
      cardName: creditCards.name,
      installmentAmount: creditCardInstallments.installmentAmount,
      totalInstallments: creditCardInstallments.totalInstallments,
      paidCount: sql<number>`COALESCE(SUM(CASE WHEN ${ledgerEntries.paid} THEN 1 ELSE 0 END), 0)::int`,
    })
    .from(creditCardInstallments)
    .innerJoin(
      creditCards,
      eq(creditCards.id, creditCardInstallments.creditCardId)
    )
    .leftJoin(
      ledgerEntries,
      and(
        // sourceId เป็น text → cast installment.id เป็น text ก่อนเทียบ
        eq(ledgerEntries.sourceId, sql`${creditCardInstallments.id}::text`),
        eq(ledgerEntries.type, "CREDIT_CARD_INSTALLMENT")
      )
    )
    .where(
      and(
        eq(creditCardInstallments.userId, user.id),
        eq(creditCardInstallments.status, "active")
      )
    )
    .groupBy(
      creditCardInstallments.id,
      creditCards.id,
      creditCards.name,
      creditCardInstallments.name,
      creditCardInstallments.installmentAmount,
      creditCardInstallments.totalInstallments
    )
    .orderBy(asc(creditCardInstallments.name));

  return rows.map((r) => {
    const remainingPeriods = Math.max(0, r.totalInstallments - r.paidCount);
    const installmentAmount = Number(r.installmentAmount);
    return {
      id: r.id,
      name: r.name,
      cardName: r.cardName,
      installmentAmount,
      totalInstallments: r.totalInstallments,
      paidCount: r.paidCount,
      remaining: remainingPeriods * installmentAmount,
    };
  });
}

// -----------------------------------------------------------------------------
// 2.7 ความหนาแน่นภาระรายเดือน 12 ช่อง ต่อปี
// query เดียวคืน map ทุกปี + ปีปัจจุบันถ้ายังไม่มี data → year selector เล่นฝั่ง
// client ได้ทันทีไม่ต้อง round-trip
// -----------------------------------------------------------------------------
export type HeatmapCell = {
  month: number; // 1-12
  total: number;
};

export type HeatmapByYear = {
  years: number[]; // เรียงน้อย→มาก
  byYear: Record<number, HeatmapCell[]>;
};

function emptyYearCells(): HeatmapCell[] {
  return Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }));
}

export async function getHeatmapByYears(
  fallbackYear: number
): Promise<HeatmapByYear> {
  const user = await getCurrentUser();
  const rows = await db
    .select({
      year: ledgerEntries.year,
      month: ledgerEntries.month,
      total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, user.id))
    .groupBy(ledgerEntries.year, ledgerEntries.month)
    .orderBy(asc(ledgerEntries.year), asc(ledgerEntries.month));

  const byYear: Record<number, HeatmapCell[]> = {};
  for (const r of rows) {
    if (!byYear[r.year]) byYear[r.year] = emptyYearCells();
    byYear[r.year][r.month - 1].total = Number(r.total);
  }
  // ให้ปี fallback (ปัจจุบัน) มีอยู่เสมอ
  if (!byYear[fallbackYear]) byYear[fallbackYear] = emptyYearCells();

  const years = Object.keys(byYear)
    .map((y) => Number(y))
    .sort((a, b) => a - b);

  return { years, byYear };
}

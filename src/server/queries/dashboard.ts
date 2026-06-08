import "server-only";

import { and, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  creditCardInstallments,
  ledgerEntries,
  type LedgerEntryType,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export type DashboardKpis = {
  total: number;
  paid: number;
  unpaid: number;
  activeInstallmentCount: number;
  remainingInstallmentAmount: number;
};

export async function getDashboardKpis(
  year: number,
  month: number
): Promise<DashboardKpis> {
  const user = await getCurrentUser();

  const [monthRow] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
      paid: sql<string>`COALESCE(SUM(CASE WHEN ${ledgerEntries.paid} THEN ${ledgerEntries.amount} ELSE 0 END), 0)`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.year, year),
        eq(ledgerEntries.month, month)
      )
    );

  const total = Number(monthRow?.total ?? 0);
  const paid = Number(monthRow?.paid ?? 0);

  // ยอดผ่อนคงเหลือจากแผน active: (totalInstallments - paidCount) * installmentAmount
  const planRows = await db
    .select({
      totalInstallments: creditCardInstallments.totalInstallments,
      installmentAmount: creditCardInstallments.installmentAmount,
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
    .where(
      and(
        eq(creditCardInstallments.userId, user.id),
        eq(creditCardInstallments.status, "active")
      )
    )
    .groupBy(creditCardInstallments.id);

  const remainingInstallmentAmount = planRows.reduce((s, p) => {
    const remaining = Math.max(0, p.totalInstallments - p.paidCount);
    return s + remaining * Number(p.installmentAmount);
  }, 0);

  return {
    total,
    paid,
    unpaid: Math.max(0, total - paid),
    activeInstallmentCount: planRows.length,
    remainingInstallmentAmount,
  };
}

export type MonthlyTrendPoint = {
  year: number;
  month: number;
  total: number;
};

export async function getMonthlyTrend(
  endYear: number,
  endMonth: number,
  monthsBack = 6
): Promise<MonthlyTrendPoint[]> {
  const user = await getCurrentUser();

  const months: { year: number; month: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    let m = endMonth - i;
    let y = endYear;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    months.push({ year: y, month: m });
  }
  const startKey = months[0].year * 100 + months[0].month;
  const endKey = endYear * 100 + endMonth;

  const rows = await db
    .select({
      year: ledgerEntries.year,
      month: ledgerEntries.month,
      total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.userId, user.id),
        gte(sql`${ledgerEntries.year} * 100 + ${ledgerEntries.month}`, startKey),
        lte(sql`${ledgerEntries.year} * 100 + ${ledgerEntries.month}`, endKey)
      )
    )
    .groupBy(ledgerEntries.year, ledgerEntries.month);

  const map = new Map(
    rows.map((r) => [`${r.year}-${r.month}`, Number(r.total)])
  );
  return months.map((m) => ({
    year: m.year,
    month: m.month,
    total: map.get(`${m.year}-${m.month}`) ?? 0,
  }));
}

export type TypeBreakdownItem = {
  type: LedgerEntryType;
  total: number;
};

export async function getTypeBreakdown(
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

  return rows.map((r) => ({ type: r.type, total: Number(r.total) }));
}

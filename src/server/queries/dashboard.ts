import "server-only";

import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import {
  categories,
  creditCardInstallments,
  creditCards,
  ledgerEntries,
  recurringTemplates,
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
// 2.3 ไปข้างหน้า n เดือน (ไม่รวมเดือนอ้างอิง) = "ประมาณการ" รายจ่ายล่วงหน้า
// recurring ลง ledger เฉพาะเดือนที่ user import เอง → เดือนอนาคตต้อง project เพิ่ม
//   ยอด = ledger จริง (ยกเว้น recurring กันนับซ้ำ) + project รายการประจำ active
//   defaultAmount NULL → fallback ยอดล่าสุดที่เคยลงของ template นั้น
// -----------------------------------------------------------------------------
export async function getUpcomingTotals(
  year: number,
  month: number,
  n = 6
): Promise<MonthTotal[]> {
  const user = await getCurrentUser();
  const months = buildMonthRange(year, month, n, "forward");
  const keys = months.map((m) => m.year * 100 + m.month);
  const startKey = Math.min(...keys);
  const endKey = Math.max(...keys);

  const [ledgerRows, templates, recurringAmounts] = await Promise.all([
    // 1) ยอดจริงใน ledger ยกเว้น recurring (installment/one-time/รูดบัตร) — กันนับซ้ำกับ projection
    db
      .select({
        year: ledgerEntries.year,
        month: ledgerEntries.month,
        total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
      })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.userId, user.id),
          sql`${ledgerEntries.year} * 100 + ${ledgerEntries.month} BETWEEN ${startKey} AND ${endKey}`,
          sql`${ledgerEntries.sourceType} IS DISTINCT FROM 'recurring_template'`
        )
      )
      .groupBy(ledgerEntries.year, ledgerEntries.month),
    // 2) รายการประจำที่ยัง active
    db
      .select({
        id: recurringTemplates.id,
        defaultAmount: recurringTemplates.defaultAmount,
        billingCycle: recurringTemplates.billingCycle,
        renewDate: recurringTemplates.renewDate,
      })
      .from(recurringTemplates)
      .where(
        and(
          eq(recurringTemplates.userId, user.id),
          eq(recurringTemplates.active, true)
        )
      ),
    // 3) ยอด recurring ที่เคยลงจริง (ไว้หา "ยอดล่าสุด" ตอน defaultAmount NULL)
    db
      .select({
        sourceId: ledgerEntries.sourceId,
        year: ledgerEntries.year,
        month: ledgerEntries.month,
        amount: ledgerEntries.amount,
      })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.userId, user.id),
          eq(ledgerEntries.sourceType, "recurring_template"),
          isNotNull(ledgerEntries.amount)
        )
      ),
  ]);

  const ledgerByKey = new Map(
    ledgerRows.map((r) => [r.year * 100 + r.month, Number(r.total)])
  );

  // ยอดล่าสุดต่อ template = row ที่ key (year*100+month) มากสุด
  const lastAmountById = new Map<string, number>();
  const lastKeyById = new Map<string, number>();
  for (const r of recurringAmounts) {
    if (!r.sourceId || r.amount == null) continue;
    const key = r.year * 100 + r.month;
    if (key >= (lastKeyById.get(r.sourceId) ?? -Infinity)) {
      lastKeyById.set(r.sourceId, key);
      lastAmountById.set(r.sourceId, Number(r.amount));
    }
  }

  type Tmpl = (typeof templates)[number];
  const effectiveAmount = (t: Tmpl): number =>
    t.defaultAmount != null
      ? Number(t.defaultAmount)
      : (lastAmountById.get(t.id) ?? 0);

  // monthly = ทุกเดือน · yearly = เฉพาะเดือนที่ตรง renewDate (ไม่มี renewDate → ไม่ project)
  const billsIn = (t: Tmpl, m: number): boolean => {
    if (t.billingCycle === "monthly") return true;
    if (!t.renewDate) return false;
    return Number(t.renewDate.slice(5, 7)) === m;
  };

  return months.map((m) => {
    const ledger = ledgerByKey.get(m.year * 100 + m.month) ?? 0;
    const recurring = templates
      .filter((t) => billsIn(t, m.month))
      .reduce((s, t) => s + effectiveAmount(t), 0);
    return { year: m.year, month: m.month, total: ledger + recurring };
  });
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
  name: string | null; // null = id ไม่อยู่ใน catalog (user พิมพ์เอง / id เก่า) → fallback ที่ UI
  icon: string | null;
  colorBg: string | null;
  colorFg: string | null;
  total: number;
};

// LEFT JOIN: ห้าม inner join + ห้าม filter active=true — ไม่งั้นยอดที่ใช้ category ถูก disable/ลบ จะหายเงียบๆ
export async function getCategoryFlow(): Promise<CategoryFlowItem[]> {
  const user = await getCurrentUser();
  const rows = await db
    .select({
      categoryId: ledgerEntries.categoryId,
      name: categories.name,
      icon: categories.icon,
      colorBg: categories.colorBg,
      colorFg: categories.colorFg,
      total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .leftJoin(categories, eq(categories.id, ledgerEntries.categoryId))
    .where(eq(ledgerEntries.userId, user.id))
    .groupBy(
      ledgerEntries.categoryId,
      categories.name,
      categories.icon,
      categories.colorBg,
      categories.colorFg
    )
    .orderBy(desc(sql`COALESCE(SUM(${ledgerEntries.amount}), 0)`));

  return rows
    .map((r) => ({
      categoryId: r.categoryId,
      name: r.name,
      icon: r.icon,
      colorBg: r.colorBg,
      colorFg: r.colorFg,
      total: Number(r.total),
    }))
    .filter((r) => r.total > 0);
}

// เหมือน getCategoryFlow แต่กรองเฉพาะเดือนปัจจุบัน (ใช้ใน tab เดือนนี้)
export async function getCategoryFlowByMonth(
  year: number,
  month: number
): Promise<CategoryFlowItem[]> {
  const user = await getCurrentUser();
  const rows = await db
    .select({
      categoryId: ledgerEntries.categoryId,
      name: categories.name,
      icon: categories.icon,
      colorBg: categories.colorBg,
      colorFg: categories.colorFg,
      total: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`,
    })
    .from(ledgerEntries)
    .leftJoin(categories, eq(categories.id, ledgerEntries.categoryId))
    .where(
      and(
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.year, year),
        eq(ledgerEntries.month, month)
      )
    )
    .groupBy(
      ledgerEntries.categoryId,
      categories.name,
      categories.icon,
      categories.colorBg,
      categories.colorFg
    )
    .orderBy(desc(sql`COALESCE(SUM(${ledgerEntries.amount}), 0)`));

  return rows
    .map((r) => ({
      categoryId: r.categoryId,
      name: r.name,
      icon: r.icon,
      colorBg: r.colorBg,
      colorFg: r.colorFg,
      total: Number(r.total),
    }))
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

  return rows
    .map((r) => {
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
    })
    // เหลือผ่อนมากสุดขึ้นก่อน
    .sort((a, b) => b.remaining - a.remaining);
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

// -----------------------------------------------------------------------------
// 2.8 timeline เดือนนี้ — รายการต้องจ่าย เรียงตาม "วันครบกำหนด"
// ledger ไม่เก็บ day → resolve จาก source ผ่าน sourceType/sourceId:
//   credit_card             → credit_cards.dueDate
//   credit_card_installment → installment → card.dueDate
//   recurring_template      → renewDate (เอาเฉพาะวัน)
//   null/manual             → ไม่มีวัน (กองท้าย)
// join ผ่าน sourceId (text) → cast id ต้นทางเป็น ::text เหมือน query อื่น
// -----------------------------------------------------------------------------
export type TimelineItem = {
  id: string;
  name: string;
  type: LedgerEntryType;
  amount: number | null; // null = ยังไม่ระบุยอด
  paid: boolean;
  day: number | null; // null = ไม่ระบุวัน
  cardName: string | null; // ชื่อบัตร (credit_card / installment) ถ้ามี
};

export async function getThisMonthTimeline(
  year: number,
  month: number
): Promise<TimelineItem[]> {
  const user = await getCurrentUser();

  const directCard = alias(creditCards, "direct_card");
  const instCard = alias(creditCards, "inst_card");

  const rows = await db
    .select({
      id: ledgerEntries.id,
      name: ledgerEntries.name,
      type: ledgerEntries.type,
      amount: ledgerEntries.amount,
      paid: ledgerEntries.paid,
      sourceType: ledgerEntries.sourceType,
      directDueDate: directCard.dueDate,
      directCardName: directCard.name,
      instDueDate: instCard.dueDate,
      instCardName: instCard.name,
      renewDate: recurringTemplates.renewDate,
    })
    .from(ledgerEntries)
    .leftJoin(
      directCard,
      and(
        eq(ledgerEntries.sourceType, "credit_card"),
        eq(ledgerEntries.sourceId, sql`${directCard.id}::text`)
      )
    )
    .leftJoin(
      creditCardInstallments,
      and(
        eq(ledgerEntries.sourceType, "credit_card_installment"),
        eq(ledgerEntries.sourceId, sql`${creditCardInstallments.id}::text`)
      )
    )
    .leftJoin(instCard, eq(instCard.id, creditCardInstallments.creditCardId))
    .leftJoin(
      recurringTemplates,
      and(
        eq(ledgerEntries.sourceType, "recurring_template"),
        eq(ledgerEntries.sourceId, sql`${recurringTemplates.id}::text`)
      )
    )
    .where(
      and(
        eq(ledgerEntries.userId, user.id),
        eq(ledgerEntries.year, year),
        eq(ledgerEntries.month, month)
      )
    );

  // dueDate=31 แต่เดือนนี้ไม่มีวันที่ 31 → clamp เป็นวันสุดท้ายของเดือน
  const lastDay = new Date(year, month, 0).getDate();
  const clampDay = (d: number | null): number | null =>
    d == null ? null : Math.min(Math.max(d, 1), lastDay);

  const items: TimelineItem[] = rows.map((r) => {
    let day: number | null = null;
    let cardName: string | null = null;

    switch (r.sourceType) {
      case "credit_card":
        day = r.directDueDate;
        cardName = r.directCardName;
        break;
      case "credit_card_installment":
        day = r.instDueDate;
        cardName = r.instCardName;
        break;
      case "recurring_template":
        // renewDate = 'YYYY-MM-DD' → เอาเฉพาะวัน
        day = r.renewDate ? Number(r.renewDate.slice(8, 10)) : null;
        break;
      default:
        day = null;
    }

    return {
      id: r.id,
      name: r.name,
      type: r.type,
      amount: r.amount == null ? null : Number(r.amount),
      paid: r.paid,
      day: clampDay(day),
      cardName,
    };
  });

  // เรียง: มีวัน (asc) ก่อน → ไม่ระบุวันไว้ท้าย · วันเดียวกัน ยังไม่จ่ายขึ้นก่อน
  return items.sort((a, b) => {
    const da = a.day ?? Infinity;
    const dbb = b.day ?? Infinity;
    if (da !== dbb) return da - dbb;
    if (a.paid !== b.paid) return a.paid ? 1 : -1;
    return 0;
  });
}

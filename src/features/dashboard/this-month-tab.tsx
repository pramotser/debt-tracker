"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMoney, formatYearMonth } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MonthTotal } from "@/server/queries/dashboard";

import { CategoryFlowList } from "./category-flow-list";
import { TypeBreakdownDonut } from "./type-breakdown-donut";
import type { DashboardData } from "./types";

// เทียบยอดรวมทั้งเดือนกับเดือนก่อนหน้า · null ถ้า <2 เดือน หรือเดือนก่อนเป็น 0
function computeMoM(
  trailing: MonthTotal[]
): { pct: number; diff: number } | null {
  if (trailing.length < 2) return null;
  const current = trailing[trailing.length - 1].total;
  const prev = trailing[trailing.length - 2].total;
  if (prev === 0) return null;
  return { pct: Math.round(((current - prev) / prev) * 100), diff: current - prev };
}

export function ThisMonthTab({ data }: { data: DashboardData }) {
  const {
    year,
    month,
    summary,
    trailing,
    typeBreakdownThisMonth,
    categoryFlowThisMonth,
  } = data;
  const { total, paid, due, naCount, entryCount } = summary;

  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const mom = computeMoM(trailing);

  const progressMessage = (() => {
    if (entryCount === 0) return "ยังไม่มีรายการเดือนนี้";
    if (total === 0) return "ยังไม่ระบุยอดของรายการเดือนนี้";
    if (due <= 0) return "จ่ายครบทุกรายการแล้ว 🎉";
    return `ค้างอยู่ ${formatMoney(due)}`;
  })();

  // การ์ดข้อสังเกต — ตอนนี้มี MoM เทียบเดือนก่อน (มากกว่า=แดง · น้อยกว่า=เขียว)
  // เผื่อ insight อื่นในอนาคต ค่อย push row เพิ่มใน CardContent นี้
  const insightCard = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ข้อสังเกต</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {mom ? (
          <div
            className={cn(
              "flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-3 py-2 text-sm",
              mom.pct > 0 &&
                "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
              mom.pct < 0 &&
                "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
              mom.pct === 0 && "bg-muted text-muted-foreground"
            )}
          >
            {mom.pct > 0 ? (
              <TrendingUp className="size-4 shrink-0" />
            ) : mom.pct < 0 ? (
              <TrendingDown className="size-4 shrink-0" />
            ) : (
              <Minus className="size-4 shrink-0" />
            )}
            <span className="font-medium">
              {mom.pct > 0
                ? `จ่ายมากกว่าเดือนก่อน ${mom.pct}%`
                : mom.pct < 0
                  ? `จ่ายน้อยกว่าเดือนก่อน ${Math.abs(mom.pct)}%`
                  : "เท่ากับเดือนก่อน"}
            </span>
            {mom.pct !== 0 ? (
              <span className="whitespace-nowrap tabular-nums opacity-80">
                ({mom.diff > 0 ? "+" : "−"}
                {formatMoney(Math.abs(mom.diff))})
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            ยังไม่มีข้อมูลพอเปรียบเทียบกับเดือนก่อน
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* KPI summary */}
      <Card className="gap-4 p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground">เดือน</div>
          <div className="text-xl font-bold tabular-nums">
            {formatYearMonth(year, month)}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat
            label="ยอดรวมเดือนนี้"
            value={formatMoney(total)}
            hint={`${entryCount} รายการ`}
            naHint={
              naCount > 0
                ? `${naCount} รายการยังไม่ระบุยอด`
                : undefined
            }
          />
          <Stat
            label="จ่ายแล้ว"
            value={formatMoney(paid)}
            hint={total > 0 ? `${paidPct}% ของยอดรวม` : undefined}
            className="text-emerald-600"
          />
          <Stat
            label="ค้างจ่าย"
            value={formatMoney(due)}
            hint={total > 0 ? `${100 - paidPct}% ของยอดรวม` : undefined}
            className="text-orange-600"
          />
        </div>

        {entryCount > 0 ? (
          <div className="flex flex-col gap-2">
            <Progress
              value={paidPct}
              className="block [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-indicator]]:bg-emerald-500"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{progressMessage}</span>
              <span className="tabular-nums">
                จ่ายแล้ว {paidPct}%
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {progressMessage}
          </div>
        )}
      </Card>

      {/* timeline (this-month-timeline.tsx) ซ่อนไว้ก่อน รอ logic รอบบัตรเครดิต
          (วันตัด/วันครบกำหนด) ที่รูดข้ามรอบให้ถูกก่อน */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        {/* ซ้าย: insight (MoM) เหนือ donut · ขวา: category flow เต็มความสูง */}
        <div className="flex flex-col gap-4">
          {insightCard}
          <TypeBreakdownDonut
            data={typeBreakdownThisMonth}
            title="รายจ่ายตามประเภทเดือนนี้"
          />
        </div>
        <CategoryFlowList
          data={categoryFlowThisMonth}
          title="เงินไหลไปหมวดไหนเดือนนี้"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  naHint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  naHint?: string;
  className?: string;
}) {
  return (
    <div className="rounded-xl border bg-background px-4 py-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "whitespace-nowrap text-xl font-semibold tabular-nums",
          className
        )}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
      {naHint ? (
        <div className="mt-1 text-xs text-amber-600">{naHint}</div>
      ) : null}
    </div>
  );
}

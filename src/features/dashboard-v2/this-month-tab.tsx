"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMoney, formatYearMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

import { MonthlyTrendChart } from "./monthly-trend-chart";
import { TypeBreakdownDonut } from "./type-breakdown-donut";
import type { DashboardV2Data } from "./types";

export function ThisMonthTab({ data }: { data: DashboardV2Data }) {
  const { year, month, summary, trailing, typeBreakdownThisMonth } = data;
  const { total, paid, due, naCount, entryCount } = summary;

  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;

  const progressMessage = (() => {
    if (entryCount === 0) return "ยังไม่มีรายการเดือนนี้";
    if (total === 0) return "ยังไม่ระบุยอดของรายการเดือนนี้";
    if (due <= 0) return "จ่ายครบทุกรายการแล้ว 🎉";
    return `ค้างอยู่ ${formatMoney(due)}`;
  })();

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MonthlyTrendChart data={trailing} />
        <TypeBreakdownDonut
          data={typeBreakdownThisMonth}
          title="รายจ่ายตามประเภทเดือนนี้"
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

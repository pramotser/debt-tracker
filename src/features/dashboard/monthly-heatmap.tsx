"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney, formatMonthShortTh } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HeatmapByYear } from "@/server/queries/dashboard";

// GitHub-style 5-stop scale (empty + 4 green steps)
const INTENSITY_STOPS = [
  "bg-muted",
  "bg-emerald-200 dark:bg-emerald-900",
  "bg-emerald-400 dark:bg-emerald-700",
  "bg-emerald-600 dark:bg-emerald-500",
  "bg-emerald-800 dark:bg-emerald-300",
];

function intensityClass(value: number, max: number): string {
  if (max <= 0 || value <= 0) return INTENSITY_STOPS[0];
  const ratio = value / max;
  // map (0, 1] → stops 1..4
  const idx = Math.min(
    INTENSITY_STOPS.length - 1,
    1 + Math.floor(ratio * (INTENSITY_STOPS.length - 1 - 0.0001))
  );
  return INTENSITY_STOPS[idx];
}

export function MonthlyHeatmap({
  data,
  initialYear,
}: {
  data: HeatmapByYear;
  initialYear: number;
}) {
  const fallbackYear =
    data.byYear[initialYear] !== undefined
      ? initialYear
      : data.years[data.years.length - 1] ?? initialYear;
  const [year, setYear] = useState(fallbackYear);

  const cells = data.byYear[year] ?? [];
  const max = useMemo(
    () => cells.reduce((m, c) => (c.total > m ? c.total : m), 0),
    [cells]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">
          ความหนาแน่นภาระรายเดือน
        </CardTitle>
        {data.years.length > 1 ? (
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="h-8 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground tabular-nums">
            {year}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="grid flex-1 grid-cols-6 gap-2 sm:grid-cols-12">
          {cells.map((c) => (
            <div
              key={c.month}
              className="flex flex-col items-center gap-1"
              title={`${formatMonthShortTh(c.month)} · ${formatMoney(c.total)}`}
            >
              <div
                className={cn(
                  "min-h-10 w-full flex-1 rounded-md transition-colors",
                  intensityClass(c.total, max)
                )}
                aria-label={`${formatMonthShortTh(c.month)} ${formatMoney(c.total)}`}
              />
              <div className="text-[10px] text-muted-foreground">
                {formatMonthShortTh(c.month)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>น้อย</span>
          <div className="flex gap-1">
            {INTENSITY_STOPS.map((c, i) => (
              <span
                key={i}
                aria-hidden
                className={cn("size-3 rounded-sm", c)}
              />
            ))}
          </div>
          <span>มาก</span>
        </div>
      </CardContent>
    </Card>
  );
}

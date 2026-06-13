"use client";

import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney } from "@/lib/format";
import type { LedgerEntryType } from "@/db/schema";
import type { TypeBreakdownItem } from "@/server/queries/dashboard-v2";

const TYPE_LABEL: Record<LedgerEntryType, string> = {
  CREDIT_CARD_INSTALLMENT: "ผ่อนบัตรเครดิต",
  FIXED_COST: "ค่าใช้จ่ายรายเดือน",
  CREDIT_CARD: "บัตรเครดิต",
  ONE_TIME_COST: "ค่าใช้จ่ายอื่น ๆ",
  SUBSCRIPTION: "Subscription",
};

const TYPE_COLOR: Record<LedgerEntryType, string> = {
  CREDIT_CARD_INSTALLMENT: "var(--chart-1)",
  FIXED_COST: "var(--chart-2)",
  CREDIT_CARD: "var(--chart-3)",
  SUBSCRIPTION: "var(--chart-4)",
  ONE_TIME_COST: "var(--chart-5)",
};

const config = {
  total: { label: "ยอดรวม" },
} satisfies ChartConfig;

export function TypeBreakdownDonut({
  data,
  title = "รายจ่ายตามประเภท",
}: {
  data: TypeBreakdownItem[];
  title?: string;
}) {
  const grandTotal = data.reduce((s, d) => s + d.total, 0);
  const chartData = data.map((d) => ({
    type: d.type,
    label: TYPE_LABEL[d.type],
    total: d.total,
    color: TYPE_COLOR[d.type],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {grandTotal > 0 ? (
          <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
            <ChartContainer config={config} className="mx-auto h-[180px] w-[180px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, _name, item) => {
                        const total = Number(value);
                        const pct = grandTotal > 0
                          ? Math.round((total / grandTotal) * 100)
                          : 0;
                        return `${item.payload.label} · ${formatMoney(total)} (${pct}%)`;
                      }}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="total"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {chartData.map((d) => (
                    <Cell key={d.type} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="flex flex-col gap-2 text-sm">
              {chartData.map((d) => {
                const pct = grandTotal > 0
                  ? Math.round((d.total / grandTotal) * 100)
                  : 0;
                return (
                  <li key={d.type} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="flex-1 truncate">{d.label}</span>
                    <span className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {formatMoney(d.total)} ({pct}%)
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            ยังไม่มีรายการ
          </div>
        )}
      </CardContent>
    </Card>
  );
}

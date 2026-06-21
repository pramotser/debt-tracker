"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney, formatMonthShortTh, formatYearMonth } from "@/lib/format";
import type { MonthTotal } from "@/server/queries/dashboard";

const config = {
  total: {
    label: "ยอดรวม",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function MonthlyTrendChart({ data }: { data: MonthTotal[] }) {
  const chartData = data.map((d) => ({
    label: formatMonthShortTh(d.month),
    ym: formatYearMonth(d.year, d.month),
    total: d.total,
  }));
  const hasAny = chartData.some((d) => d.total > 0);
  const lastIndex = chartData.length - 1;

  // จุดสุดท้าย = หัวลูกศรชี้ไปข้างหน้า · จุดอื่น = dot กลมเล็ก
  const renderDot = (props: { cx?: number; cy?: number; index?: number }) => {
    const { cx, cy, index } = props;
    const key = `dot-${index}`;
    if (cx == null || cy == null) return <g key={key} />;
    if (index === lastIndex) {
      return (
        <path
          key={key}
          d={`M ${cx - 3} ${cy - 6} L ${cx + 8} ${cy} L ${cx - 3} ${cy + 6} Z`}
          fill="var(--color-total)"
        />
      );
    }
    return <circle key={key} cx={cx} cy={cy} r={3} fill="var(--color-total)" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">แนวโน้ม 6 เดือนย้อนหลัง</CardTitle>
      </CardHeader>
      <CardContent>
        {hasAny ? (
          <ChartContainer config={config} className="h-[220px] w-full">
            <LineChart data={chartData} margin={{ left: 4, right: 16 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_label, payload) =>
                      payload?.[0]?.payload?.ym ?? ""
                    }
                    formatter={(value) => formatMoney(Number(value))}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                strokeWidth={2}
                dot={renderDot}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            ยังไม่มีรายการใน 6 เดือนที่ผ่านมา
          </div>
        )}
      </CardContent>
    </Card>
  );
}

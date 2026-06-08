"use client";

import { Cell, Label, Pie, PieChart } from "recharts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney } from "@/lib/format";
import type { LedgerEntryType } from "@/db/schema";
import type { TypeBreakdownItem } from "@/server/queries/dashboard";

const TYPE_LABEL: Record<LedgerEntryType, string> = {
  FIXED_COST: "ค่าใช้จ่ายประจำ",
  SUBSCRIPTION: "สมาชิก/บริการ",
  CREDIT_CARD: "บัตรเครดิต",
  CREDIT_CARD_INSTALLMENT: "ผ่อนชำระ",
  ONE_TIME_COST: "ครั้งเดียว",
};

const TYPE_COLOR: Record<LedgerEntryType, string> = {
  FIXED_COST: "var(--chart-1)",
  SUBSCRIPTION: "var(--chart-2)",
  CREDIT_CARD: "var(--chart-3)",
  CREDIT_CARD_INSTALLMENT: "var(--chart-4)",
  ONE_TIME_COST: "var(--chart-5)",
};

const config = {
  total: { label: "รายจ่าย" },
  FIXED_COST: { label: TYPE_LABEL.FIXED_COST, color: TYPE_COLOR.FIXED_COST },
  SUBSCRIPTION: {
    label: TYPE_LABEL.SUBSCRIPTION,
    color: TYPE_COLOR.SUBSCRIPTION,
  },
  CREDIT_CARD: { label: TYPE_LABEL.CREDIT_CARD, color: TYPE_COLOR.CREDIT_CARD },
  CREDIT_CARD_INSTALLMENT: {
    label: TYPE_LABEL.CREDIT_CARD_INSTALLMENT,
    color: TYPE_COLOR.CREDIT_CARD_INSTALLMENT,
  },
  ONE_TIME_COST: {
    label: TYPE_LABEL.ONE_TIME_COST,
    color: TYPE_COLOR.ONE_TIME_COST,
  },
} satisfies ChartConfig;

export function TypeBreakdownChart({ data }: { data: TypeBreakdownItem[] }) {
  const filtered = data.filter((d) => d.total > 0);
  const total = filtered.reduce((s, d) => s + d.total, 0);

  if (filtered.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>สัดส่วนเดือนนี้</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          ยังไม่มีรายการเดือนนี้
        </CardContent>
      </Card>
    );
  }

  const chartData = filtered.map((d) => ({
    name: d.type,
    label: TYPE_LABEL[d.type],
    value: d.total,
    fill: TYPE_COLOR[d.type],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>สัดส่วนเดือนนี้</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="mx-auto aspect-square h-[200px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => {
                    const label = TYPE_LABEL[item.payload.name as LedgerEntryType] ?? name;
                    return (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span>{label}</span>
                        <span className="font-medium tabular-nums">
                          {formatMoney(Number(value))}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox)) return null;
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) - 6}
                        className="fill-muted-foreground text-xs"
                      >
                        รวม
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 14}
                        className="fill-foreground text-sm font-semibold tabular-nums"
                      >
                        {formatMoney(total)}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-4 flex flex-col gap-1.5">
          {chartData.map((d) => (
            <div
              key={d.name}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: d.fill }}
              />
              <span className="flex-1 text-muted-foreground">{d.label}</span>
              <span className="font-medium tabular-nums">
                {formatMoney(d.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

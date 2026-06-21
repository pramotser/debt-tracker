"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import type { CategoryFlowItem } from "@/server/queries/dashboard";

export function CategoryFlowList({
  data,
  title = "เงินไหลไปหมวดไหน",
}: {
  data: CategoryFlowItem[];
  title?: string;
}) {
  const max = data.reduce((m, d) => (d.total > m ? d.total : m), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            ยังไม่มีรายการ
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.map((d) => {
              const ratio = max > 0 ? d.total / max : 0;
              const Icon = getCategoryIcon(d.icon);
              // fallback: ไม่อยู่ใน catalog → label = id ดิบ, ใช้สี neutral
              const label = d.name ?? d.categoryId;
              const colorBg = d.colorBg ?? "var(--muted)";
              const colorFg = d.colorFg ?? "var(--muted-foreground)";
              return (
                <li key={d.categoryId} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="flex h-6 w-6 flex-none items-center justify-center rounded-md"
                        style={{ backgroundColor: colorBg, color: colorFg }}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="truncate">{label}</span>
                    </span>
                    <span className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {formatMoney(d.total)}
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                    role="presentation"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(ratio * 100, 2)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

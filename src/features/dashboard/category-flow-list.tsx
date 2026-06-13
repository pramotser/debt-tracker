"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryLabel } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import type { CategoryFlowItem } from "@/server/queries/dashboard";

export function CategoryFlowList({ data }: { data: CategoryFlowItem[] }) {
  const max = data.reduce((m, d) => (d.total > m ? d.total : m), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          เงินไหลไปหมวดไหน
        </CardTitle>
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
              return (
                <li key={d.categoryId} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">
                      {getCategoryLabel(d.categoryId)}
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

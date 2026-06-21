"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/format";
import type { InstallmentProgressItem } from "@/server/queries/dashboard";

export function InstallmentProgress({
  data,
}: {
  data: InstallmentProgressItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          ความคืบหน้าแผนการผ่อนชำระ
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            ไม่มีแผนผ่อนที่ active
          </div>
        ) : (
          <ul className="flex max-h-[260px] flex-col gap-4 overflow-y-auto pr-1">
            {data.map((d) => {
              const pct =
                d.totalInstallments > 0
                  ? Math.round((d.paidCount / d.totalInstallments) * 100)
                  : 0;
              return (
                <li key={d.id} className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{d.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {d.cardName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="tabular-nums">
                        {d.paidCount}/{d.totalInstallments} งวด
                      </div>
                      <div className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                        เหลือ {formatMoney(d.remaining)}
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    className="block [&_[data-slot=progress-track]]:h-1.5"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

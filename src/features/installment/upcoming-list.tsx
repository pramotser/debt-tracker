"use client";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMoney, formatYearMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { LedgerEntry } from "./types";

export function UpcomingList({
  items,
  onTogglePaid,
}: {
  items: LedgerEntry[];
  onTogglePaid: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <Card className="px-6 py-8 text-center text-sm text-muted-foreground">
        ไม่มีงวดที่ยังไม่จ่าย
      </Card>
    );
  }
  return (
    <Card className="gap-0 divide-y divide-border p-0">
      {items.map((e) => (
        <div
          key={e.id}
          className={cn(
            "flex items-center gap-4 px-5 py-3.5 text-sm",
            e.paid && "opacity-60"
          )}
        >
          <Checkbox checked={e.paid} onCheckedChange={() => onTogglePaid(e.id)} />
          <div className="w-20 shrink-0 text-muted-foreground tabular-nums">
            {formatYearMonth(e.year, e.month)}
          </div>
          <div className={cn("min-w-0 flex-1 truncate", e.paid && "line-through")}>
            {e.name}
          </div>
          <div className="text-base font-semibold tabular-nums">
            {formatMoney(e.amount ?? "0")}
          </div>
        </div>
      ))}
    </Card>
  );
}

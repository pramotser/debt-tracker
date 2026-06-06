import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";

import type { UpcomingPayment } from "./types";

export function UpcomingList({ items }: { items: UpcomingPayment[] }) {
  if (items.length === 0) {
    return (
      <Card className="px-6 py-8 text-center text-sm text-muted-foreground">
        ไม่มีงวดที่ใกล้ถึงกำหนด
      </Card>
    );
  }
  return (
    <Card className="gap-0 divide-y divide-border p-0">
      {items.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-4 px-5 py-3.5 text-sm"
        >
          <div className="w-16 shrink-0 text-muted-foreground tabular-nums">
            {p.dueDate}
          </div>
          <div className="text-lg shrink-0">{p.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.cardName}</div>
          </div>
          <div className="text-base font-semibold tabular-nums">
            {formatMoney(p.amount)}
          </div>
        </div>
      ))}
    </Card>
  );
}

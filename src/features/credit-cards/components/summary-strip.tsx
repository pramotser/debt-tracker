import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 4 ช่องสรุปแนวนอน — ใช้ทั้ง tab1 และ tab2
export type SummaryStripItem = {
  label: string;
  value: string;
  tone?: "default" | "due" | "nearEnd" | "active" | "paid";
};

const TONE: Record<NonNullable<SummaryStripItem["tone"]>, string> = {
  default: "",
  paid: "text-[#15803D]",
  due: "text-orange-600",
  nearEnd: "text-[#92400E]",
  active: "text-[#1E40AF]",
};

export function SummaryStrip({ items }: { items: SummaryStripItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it, i) => (
        <Card key={i} className="gap-1 bg-muted/40 p-3 shadow-none sm:p-4">
          <div className="text-xs text-muted-foreground">{it.label}</div>
          <div
            className={cn(
              "truncate text-xl font-bold tabular-nums",
              it.tone ? TONE[it.tone] : ""
            )}
          >
            {it.value}
          </div>
        </Card>
      ))}
    </div>
  );
}

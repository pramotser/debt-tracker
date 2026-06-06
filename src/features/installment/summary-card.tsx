import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SummaryCard({
  dueThisMonth,
  totalRemaining,
  activeCount,
  nearEndCount,
}: {
  dueThisMonth: number;
  totalRemaining: number;
  activeCount: number;
  nearEndCount: number;
}) {
  return (
    <Card className="flex-row! flex-wrap items-center gap-x-10 gap-y-3 px-6 py-5">
      <Stat
        label="เดือนนี้ต้องจ่าย"
        value={formatMoney(dueThisMonth)}
        className="text-orange-600"
      />
      <Stat label="ยอดคงเหลือรวม" value={formatMoney(totalRemaining)} />
      <Stat label="กำลังผ่อน" value={`${activeCount} แผน`} />
      <Stat label="ใกล้จบ" value={`${nearEndCount} แผน`} />
    </Card>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-xl font-semibold tabular-nums", className)}>
        {value}
      </div>
    </div>
  );
}

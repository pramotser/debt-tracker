import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { DashboardKpis } from "@/server/queries/dashboard";

function Stat({
  label,
  value,
  className,
  hint,
}: {
  label: string;
  value: string;
  className?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${className ?? ""}`}>
        {value}
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card className="px-5 py-4">
        <Stat label="รวมเดือนนี้" value={formatMoney(kpis.total)} />
      </Card>
      <Card className="px-5 py-4">
        <Stat
          label="จ่ายแล้ว"
          value={formatMoney(kpis.paid)}
          className="text-emerald-600"
        />
      </Card>
      <Card className="px-5 py-4">
        <Stat
          label="ค้างจ่าย"
          value={formatMoney(kpis.unpaid)}
          className="text-orange-600"
        />
      </Card>
      <Card className="px-5 py-4">
        <Stat
          label="หนี้ผ่อนคงเหลือ"
          value={formatMoney(kpis.remainingInstallmentAmount)}
          hint={`${kpis.activeInstallmentCount} แผน active`}
        />
      </Card>
    </div>
  );
}

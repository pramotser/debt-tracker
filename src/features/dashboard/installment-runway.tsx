import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatYearMonth } from "@/lib/format";
import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";

function planEndYearMonth(plan: InstallmentPlanWithProgress) {
  const totalIndex = plan.startMonth - 1 + (plan.totalInstallments - 1);
  const year = plan.startYear + Math.floor(totalIndex / 12);
  const month = (totalIndex % 12) + 1;
  return { year, month };
}

export function InstallmentRunway({
  plans,
}: {
  plans: InstallmentPlanWithProgress[];
}) {
  const active = plans.filter((p) => p.status === "active");

  if (active.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>แผนผ่อนคงเหลือ</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          ยังไม่มีแผนผ่อน active
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>แผนผ่อนคงเหลือ</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {active.map((plan) => {
          const total = plan.totalInstallments;
          const paid = Math.min(plan.paidCount, total);
          const pct = Math.round((paid / total) * 100);
          const remaining = Math.max(0, total - paid);
          const remainingAmount = remaining * Number(plan.installmentAmount);
          const end = planEndYearMonth(plan);

          return (
            <div key={plan.id} className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-medium">{plan.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {paid}/{total} · เหลือ {formatMoney(remainingAmount)} · จบ{" "}
                  {formatYearMonth(end.year, end.month)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

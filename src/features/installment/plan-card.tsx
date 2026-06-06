import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/format";

import type { InstallmentPlan } from "./types";

function StatusBadge({ status }: { status: InstallmentPlan["status"] }) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          ● ACTIVE
        </Badge>
      );
    case "near-end":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          ● NEAR END
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          ● COMPLETED
        </Badge>
      );
    case "early-settlement":
      return (
        <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">
          ● EARLY SETTLEMENT
        </Badge>
      );
  }
}

export function PlanCard({ plan }: { plan: InstallmentPlan }) {
  const percent =
    plan.totalInstallments > 0
      ? (plan.paidInstallments / plan.totalInstallments) * 100
      : 0;
  const isCompleted = plan.status === "completed";
  const isEarly = plan.status === "early-settlement";
  const isNearEnd = plan.status === "near-end";

  return (
    <Card className="gap-3 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{plan.icon}</span>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{plan.name}</div>
            {!isCompleted && (
              <div className="text-xs text-muted-foreground">{plan.cardName}</div>
            )}
          </div>
        </div>
        <StatusBadge status={plan.status} />
      </div>

      {isCompleted && (
        <div className="text-sm text-muted-foreground">
          ผ่อนครบ {plan.paidInstallments}/{plan.totalInstallments} งวด
        </div>
      )}

      {isEarly && (
        <div className="flex flex-col gap-1 text-sm">
          <Row label="ยอดปิดก่อนกำหนด" value={formatMoney(plan.earlySettlementAmount ?? 0)} />
          <Row label="ปิดเมื่อ" value={plan.closedDate ?? "—"} />
        </div>
      )}

      {isNearEnd && (
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="text-muted-foreground">
            งวด <span className="font-semibold text-foreground">{plan.paidInstallments}</span>{" "}
            / {plan.totalInstallments}
          </div>
          <div className="text-orange-600 font-medium">
            เหลืออีก {plan.totalInstallments - plan.paidInstallments} งวด
          </div>
          <Row label="ค่างวด" value={formatMoney(plan.installmentAmount)} />
        </div>
      )}

      {plan.status === "active" && (
        <>
          <div className="flex flex-col gap-1 text-sm">
            <Row label="ยอดรวม" value={formatMoney(plan.totalAmount)} />
            <Row label="คงเหลือ" value={formatMoney(plan.remainingAmount)} />
            <Row
              label="ค่างวด"
              value={`${formatMoney(plan.installmentAmount)} / เดือน`}
            />
          </div>
          <Progress value={percent} className="h-2.5" />
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>
              งวด {plan.paidInstallments} / {plan.totalInstallments}
            </span>
            <span>คาดว่าจะจบ : {plan.expectedEnd}</span>
          </div>
        </>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

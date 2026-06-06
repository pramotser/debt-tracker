import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/format";

export function RemainingBalanceCard({
  totalRemaining,
  totalInstallments,
  paidInstallments,
}: {
  totalRemaining: number;
  totalInstallments: number;
  paidInstallments: number;
}) {
  const remainingInstallments = totalInstallments - paidInstallments;
  const percent =
    totalInstallments > 0
      ? (paidInstallments / totalInstallments) * 100
      : 0;

  return (
    <Card className="items-center gap-4 px-6 py-8 text-center">
      <div className="text-4xl font-bold tabular-nums">
        {formatMoney(totalRemaining)}
      </div>
      <div className="text-sm text-muted-foreground">
        ยอดผ่อนคงเหลือทั้งหมด
      </div>
      <Progress value={percent} className="h-3 w-full max-w-md" />
      <div className="text-sm text-muted-foreground">
        เหลือ <span className="font-semibold text-foreground">{remainingInstallments}</span> งวด
        จากทั้งหมด <span className="font-semibold text-foreground">{totalInstallments}</span> งวด
      </div>
    </Card>
  );
}

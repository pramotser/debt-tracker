import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CategoryBadge } from "@/components/shared/category-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { STATUS } from "@/components/shared/status-tokens";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { type Category, type LedgerEntry } from "@/db/schema";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import { LEDGER_TYPE_META } from "./types";

export function LedgerRow({
  entry,
  category,
}: {
  entry: LedgerEntry;
  category?: Category;
}) {
  const meta = LEDGER_TYPE_META[entry.type];
  const accent = entry.paid ? STATUS.paid.bar : STATUS.due.bar;
  const principal = entry.principalAmount ? Number(entry.principalAmount) : null;
  const interest = entry.interestAmount ? Number(entry.interestAmount) : null;
  const hasSplit =
    (entry.type === "CREDIT_CARD_INSTALLMENT" || entry.type === "CREDIT_CARD") &&
    (principal !== null || interest !== null);

  const deepHref = `${meta.basePath}?y=${entry.year}&m=${entry.month}`;

  return (
    <Card
      className={cn(
        "relative gap-2 overflow-hidden p-0 py-3 pr-3 pl-4 text-sm shadow-sm",
        entry.paid && "opacity-70"
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className={cn("truncate font-medium", entry.paid && "line-through")}>
            {entry.name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={meta.badgeClass}>
              {meta.label}
            </Badge>
            <CategoryBadge category={category} />
            {entry.amount === null && (
              <Badge variant="outline" className="border-gray-300 text-muted-foreground">
                ยังไม่กรอกยอด
              </Badge>
            )}
          </div>
          {hasSplit && (
            <div className="mt-1 text-xs text-muted-foreground tabular-nums">
              {principal !== null && <>เงินต้น {formatMoney(principal)}</>}
              {principal !== null && interest !== null && " · "}
              {interest !== null && <>ดอกเบี้ย {formatMoney(interest)}</>}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div
            className={cn(
              "text-base font-semibold tabular-nums whitespace-nowrap",
              entry.paid && "line-through"
            )}
            style={{ color: entry.amount === null ? STATUS.due.bar : accent }}
          >
            {entry.amount === null ? "—" : formatMoney(entry.amount)}
          </div>
          <StatusBadge status={entry.paid ? "paid" : "due"} />
        </div>

        <Link
          href={deepHref}
          aria-label="ไปต้นทาง"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal, Trash2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatMoney, formatYearMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CategoryBadge } from "@/components/shared/category-badge";
import type {
  Category,
  CreditCard,
  CreditCardInstallment,
  LedgerEntry,
  UiStatus,
} from "./types";

export function StatusBadge({ status }: { status: UiStatus }) {
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

function toNumber(v: string | null): number {
  if (v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function PlanCard({
  plan,
  uiStatus,
  card,
  category,
  entries,
  onTogglePaid,
  onUpdateInterestSplit,
  onSettle,
  onDelete,
}: {
  plan: CreditCardInstallment;
  uiStatus: UiStatus;
  card?: CreditCard;
  category?: Category;
  entries: LedgerEntry[];
  onTogglePaid: (entryId: string) => void;
  onUpdateInterestSplit: (
    entryId: string,
    principal: string,
    interest: string
  ) => void;
  onSettle: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const paidCount = entries.filter((e) => e.paid).length;
  const total = plan.totalInstallments;
  const remaining = total - paidCount;
  const percent = total > 0 ? (paidCount / total) * 100 : 0;

  const totalAmount = toNumber(plan.totalAmount);
  const remainingAmount = entries
    .filter((e) => !e.paid)
    .reduce((s, e) => s + toNumber(e.amount), 0);

  // last unpaid งวด → expected end (fall back to last งวด overall)
  const lastEntry =
    entries.slice().reverse().find((e) => !e.paid) ??
    entries[entries.length - 1];
  const expectedEnd = lastEntry
    ? formatYearMonth(lastEntry.year, lastEntry.month)
    : "—";

  const isCompleted = uiStatus === "completed";
  const isEarly = uiStatus === "early-settlement";
  const isOpenForActions = !isCompleted && !isEarly;
  const showDots = !isCompleted && !isEarly && total <= 12;
  const isClosed = isCompleted || isEarly;

  return (
    <Card
      className={cn("gap-3 px-5 py-4", isClosed && "bg-muted/40 shadow-none")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-base font-semibold">{plan.name}</div>
            <CategoryBadge category={category} />
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {card?.name ?? "—"}
            {card?.lastFourDigits ? ` (****${card.lastFourDigits})` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={uiStatus} />
          {isOpenForActions && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="เมนู"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSettle}>
                  <XCircle />
                  ปิดยอดก่อนกำหนด
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 />
                  ลบแผน
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isCompleted ? (
        <div className="text-sm text-muted-foreground">
          ผ่อนครบ {paidCount}/{total} งวด
        </div>
      ) : isEarly ? (
        <div className="flex flex-col gap-1 text-sm">
          <Row
            label="ยอดปิดก่อนกำหนด"
            value={formatMoney(plan.settlementAmount ?? "0")}
          />
          {plan.closedAt && (
            <Row
              label="ปิดเมื่อ"
              value={new Date(plan.closedAt).toLocaleDateString("th-TH")}
            />
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1 text-sm">
            <Row label="ยอดรวม" value={formatMoney(totalAmount)} />
            <Row
              label="คงเหลือ"
              value={formatMoney(remainingAmount)}
              emphasize
            />
            <Row
              label="ค่างวด"
              value={`${formatMoney(plan.installmentAmount)} / เดือน`}
            />
          </div>
          <Progress
            value={percent}
            className={cn(
              "[&_[data-slot=progress-track]]:h-2.5",
              uiStatus === "near-end" &&
                "[&_[data-slot=progress-indicator]]:bg-amber-500"
            )}
          />
          {showDots && (
            <InstallmentDots total={total} paidCount={paidCount} />
          )}
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>
              งวด {paidCount} / {total}
              {uiStatus === "near-end" && (
                <span className="ml-2 font-medium text-amber-600">
                  เหลืออีก {remaining} งวด
                </span>
              )}
            </span>
            <span>คาดว่าจะจบ : {expectedEnd}</span>
          </div>
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded((v) => !v)}
        className="self-start text-xs text-muted-foreground"
      >
        {expanded ? <ChevronUp /> : <ChevronDown />}
        {expanded ? "ซ่อนรายงวด" : "ดูรายงวด"}
      </Button>

      {expanded && (
        <div className="flex flex-col gap-0 divide-y divide-border border-t border-border pt-1">
          {entries.map((e) => (
            <EntryRow
              key={e.id}
              entry={e}
              hasInterest={plan.hasInterest}
              onTogglePaid={() => onTogglePaid(e.id)}
              onUpdateInterestSplit={(p, i) =>
                onUpdateInterestSplit(e.id, p, i)
              }
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function Row({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={cn(
          "text-muted-foreground",
          emphasize && "text-foreground font-medium"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-semibold tabular-nums whitespace-nowrap",
          emphasize && "text-xl"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function InstallmentDots({
  total,
  paidCount,
}: {
  total: number;
  paidCount: number;
}) {
  const dots = Array.from({ length: total }, (_, i) => i < paidCount);
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      aria-label={`ผ่อนแล้ว ${paidCount} จาก ${total} งวด`}
    >
      {dots.map((paid, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <span
            aria-hidden
            className={cn(
              "h-2 w-full rounded-sm",
              paid ? "bg-primary" : "border border-border bg-muted"
            )}
          />
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

function EntryRow({
  entry,
  hasInterest,
  onTogglePaid,
  onUpdateInterestSplit,
}: {
  entry: LedgerEntry;
  hasInterest: boolean;
  onTogglePaid: () => void;
  onUpdateInterestSplit: (principal: string, interest: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pDraft, setPDraft] = useState("");
  const [iDraft, setIDraft] = useState("");

  const needsSplit =
    hasInterest && !entry.paid && entry.principalAmount === null;

  const startEdit = () => {
    setPDraft(entry.principalAmount ?? "");
    setIDraft(entry.interestAmount ?? "");
    setEditing(true);
  };

  const commit = () => {
    const p = Number(pDraft);
    const i = Number(iDraft);
    if (Number.isFinite(p) && Number.isFinite(i) && p >= 0 && i >= 0) {
      onUpdateInterestSplit(p.toFixed(2), i.toFixed(2));
    }
    setEditing(false);
  };

  return (
    <div className={cn("flex items-center gap-3 py-2", entry.paid && "opacity-60")}>
      <Checkbox checked={entry.paid} onCheckedChange={onTogglePaid} />
      <div className="w-20 shrink-0 text-xs text-muted-foreground tabular-nums">
        {formatYearMonth(entry.year, entry.month)}
      </div>
      {editing ? (
        <div className="flex flex-1 items-center gap-1.5">
          <Input
            autoFocus
            type="number"
            inputMode="decimal"
            placeholder="เงินต้น"
            value={pDraft}
            onChange={(e) => setPDraft(e.target.value)}
            className="h-8 w-24 text-right tabular-nums"
          />
          <span className="text-xs text-muted-foreground">+</span>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="ดอกเบี้ย"
            value={iDraft}
            onChange={(e) => setIDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              else if (e.key === "Escape") setEditing(false);
            }}
            className="h-8 w-24 text-right tabular-nums"
          />
        </div>
      ) : (
        <>
          <div
            className={cn(
              "min-w-0 flex-1 text-sm",
              entry.paid && "line-through"
            )}
          >
            {hasInterest && entry.principalAmount !== null ? (
              <span className="text-xs text-muted-foreground">
                ต้น {formatMoney(entry.principalAmount)} + ดอก{" "}
                {formatMoney(entry.interestAmount ?? "0")}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {entry.note ?? ""}
              </span>
            )}
          </div>
          {needsSplit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={startEdit}
              className="text-xs text-orange-600"
            >
              กรอกต้น/ดอก
            </Button>
          )}
          <div
            className={cn(
              "min-w-[5rem] text-right text-sm font-semibold tabular-nums",
              entry.paid && "line-through"
            )}
          >
            {formatMoney(entry.amount ?? "0")}
          </div>
        </>
      )}
    </div>
  );
}

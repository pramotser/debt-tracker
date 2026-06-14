"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal, Trash2, XCircle } from "lucide-react";

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
import { formatMoney, formatYearMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CategoryBadge } from "@/components/shared/category-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import type { StatusKey } from "@/components/shared/status-tokens";
import { Segments } from "./components/segments";
import type {
  Category,
  CreditCard,
  CreditCardInstallment,
  LedgerEntry,
  UiStatus,
} from "./types";

function toNumber(v: string | null): number {
  if (v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// แมพ UiStatus → token status (plan ใช้ active/nearEnd/settle · off สำหรับผ่อนครบแล้ว)
function statusKeyOf(status: UiStatus): StatusKey {
  if (status === "active") return "active";
  if (status === "near-end") return "nearEnd";
  if (status === "early-settlement") return "settle";
  return "off";
}

export function PlanCard({
  plan,
  uiStatus,
  card,
  category,
  entries,
  scrollTarget,
  onScrolled,
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
  scrollTarget?: boolean;
  onScrolled?: () => void;
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
  const ref = useRef<HTMLDivElement>(null);

  // เมื่อมี scrollTarget = true → เลื่อนเข้าจอ + highlight ชั่วครู่
  useEffect(() => {
    if (!scrollTarget) return;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    onScrolled?.();
  }, [scrollTarget, onScrolled]);

  const paidCount = entries.filter((e) => e.paid).length;
  const total = plan.totalInstallments;
  const remaining = total - paidCount;

  const totalAmount = toNumber(plan.totalAmount);
  const remainingAmount = entries
    .filter((e) => !e.paid)
    .reduce((s, e) => s + toNumber(e.amount), 0);

  // last unpaid งวด → expected end (fallback ตัวสุดท้าย)
  const lastEntry =
    entries.slice().reverse().find((e) => !e.paid) ??
    entries[entries.length - 1];
  const expectedEnd = lastEntry
    ? formatYearMonth(lastEntry.year, lastEntry.month)
    : "—";

  // งวดถัดที่จะจ่าย (สำหรับ Segments highlight "current")
  const nextUnpaid = entries.find((e) => !e.paid);
  const currentIdx = nextUnpaid
    ? (nextUnpaid.year - plan.startYear) * 12 +
      (nextUnpaid.month - plan.startMonth) +
      1
    : undefined;

  const isCompleted = uiStatus === "completed";
  const isEarly = uiStatus === "early-settlement";
  const isOpenForActions = !isCompleted && !isEarly;
  const isClosed = isCompleted || isEarly;
  const statusKey = statusKeyOf(uiStatus);

  return (
    <Card
      ref={ref}
      id={`plan-${plan.id}`}
      className={cn(
        "scroll-mt-20 gap-3 px-5 py-4",
        isClosed && "bg-muted/40 shadow-none"
      )}
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
          <StatusBadge status={statusKey} />
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
              value={new Date(plan.closedAt).toLocaleDateString("en-CA")}
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
          <Segments
            total={total}
            paidCount={paidCount}
            current={currentIdx}
            numbers
          />
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

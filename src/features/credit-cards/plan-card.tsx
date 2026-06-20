"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2, XCircle } from "lucide-react";

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
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
            <Stat
              label="ค่างวด/เดือน"
              value={formatMoney(plan.installmentAmount)}
            />
            <Stat
              label="คงเหลือ"
              value={formatMoney(remainingAmount)}
              emphasize
            />
            <Stat label="ยอดรวม" value={formatMoney(totalAmount)} />
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

function Stat({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-0 text-center">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-0.5 truncate font-semibold tabular-nums",
          emphasize ? "text-foreground text-lg" : "text-sm"
        )}
      >
        {value}
      </div>
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

  const canEditSplit = hasInterest && !entry.paid;

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

  const liveTotal =
    pDraft !== "" && iDraft !== "" && Number(pDraft) >= 0 && Number(iDraft) >= 0
      ? formatMoney((Number(pDraft) + Number(iDraft)).toFixed(2))
      : formatMoney(entry.amount ?? "0");

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/30 px-3 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tabular-nums">
            งวด {formatYearMonth(entry.year, entry.month)}
          </span>
          <span className="text-sm font-semibold tabular-nums">{liveTotal}</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 gap-3">
            <div className="flex flex-1 flex-col gap-1 sm:w-36 sm:flex-none">
              <label
                htmlFor={`split-p-${entry.id}`}
                className="text-[11px] text-muted-foreground"
              >
                เงินต้น
              </label>
              <Input
                id={`split-p-${entry.id}`}
                autoFocus
                type="number"
                inputMode="decimal"
                value={pDraft}
                onChange={(e) => setPDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  else if (e.key === "Escape") setEditing(false);
                }}
                className="h-9 text-right tabular-nums"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1 sm:w-36 sm:flex-none">
              <label
                htmlFor={`split-i-${entry.id}`}
                className="text-[11px] text-muted-foreground"
              >
                ดอกเบี้ย
              </label>
              <Input
                id={`split-i-${entry.id}`}
                type="number"
                inputMode="decimal"
                value={iDraft}
                onChange={(e) => setIDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  else if (e.key === "Escape") setEditing(false);
                }}
                className="h-9 text-right tabular-nums"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
            >
              ยกเลิก
            </Button>
            <Button type="button" size="sm" onClick={commit}>
              บันทึก
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3 py-2.5", entry.paid && "opacity-60")}>
      <Checkbox
        checked={entry.paid}
        onCheckedChange={onTogglePaid}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm tabular-nums">
            {formatYearMonth(entry.year, entry.month)}
          </span>
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              entry.paid && "line-through"
            )}
          >
            {formatMoney(entry.amount ?? "0")}
          </span>
        </div>
        {hasInterest && entry.principalAmount !== null ? (
          <button
            type="button"
            onClick={canEditSplit ? startEdit : undefined}
            className={cn(
              "mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground",
              canEditSplit && "cursor-pointer hover:text-foreground",
              entry.paid && "line-through"
            )}
          >
            ต้น {formatMoney(entry.principalAmount)} + ดอก {formatMoney(entry.interestAmount ?? "0")}
            {canEditSplit && <Pencil className="size-3 shrink-0 opacity-60" />}
          </button>
        ) : canEditSplit ? (
          <button
            type="button"
            onClick={startEdit}
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
          >
            <Pencil className="size-3 shrink-0" />
            กรอกต้น/ดอก
          </button>
        ) : entry.note ? (
          <span
            className={cn(
              "mt-0.5 block text-xs text-muted-foreground",
              entry.paid && "line-through"
            )}
          >
            {entry.note}
          </span>
        ) : null}
      </div>
    </div>
  );
}

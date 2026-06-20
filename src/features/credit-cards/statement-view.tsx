"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

import { MonthNav } from "@/components/layout/month-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { getCardColorTheme } from "@/lib/banks";
import { cn } from "@/lib/utils";
import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";

import { StatusBadge } from "@/components/shared/status-badge";
import { STATUS } from "@/components/shared/status-tokens";
import { SummaryStrip } from "./components/summary-strip";
import type { CreditCard, LedgerEntry, YearMonth } from "./types";

function toNumber(v: string | null): number {
  if (v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function planById(
  plans: InstallmentPlanWithProgress[]
): Map<string, InstallmentPlanWithProgress> {
  return new Map(plans.map((p) => [p.id, p]));
}

function cardOfEntry(
  entry: LedgerEntry,
  cardById: Map<string, CreditCard>,
  planMap: Map<string, InstallmentPlanWithProgress>
): CreditCard | undefined {
  if (entry.type === "CREDIT_CARD") {
    return entry.sourceId ? cardById.get(entry.sourceId) : undefined;
  }
  if (entry.type === "CREDIT_CARD_INSTALLMENT") {
    const plan = entry.sourceId ? planMap.get(entry.sourceId) : undefined;
    return plan ? cardById.get(plan.creditCardId) : undefined;
  }
  return undefined;
}

// คำนวณว่าเป็นงวดที่เท่าไหร่ของแผน — จาก year/month vs plan.startYear/startMonth
function installmentIndex(
  entry: LedgerEntry,
  plan: InstallmentPlanWithProgress
): number {
  const diff =
    (entry.year - plan.startYear) * 12 + (entry.month - plan.startMonth);
  return diff + 1;
}

export function StatementView({
  ym,
  cards,
  plans,
  entries,
  loading = false,
  onPrev,
  onNext,
  onAddCharge,
  onTogglePaid,
  onUpdateAmount,
  onUpdateInterestSplit,
  onDelete,
  onJumpToPlan,
}: {
  ym: YearMonth;
  cards: CreditCard[];
  plans: InstallmentPlanWithProgress[];
  entries: LedgerEntry[];
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onAddCharge: () => void;
  onTogglePaid: (entry: LedgerEntry, next: boolean) => Promise<void>;
  onUpdateAmount: (entry: LedgerEntry, amount: string) => void;
  onUpdateInterestSplit: (entry: LedgerEntry, principal: string, interest: string) => void;
  onDelete: (entry: LedgerEntry) => void;
  onJumpToPlan: (planId: string) => void;
}) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // baseline = entries (server-controlled); optimistic = พลิก paid ทันทีระหว่าง transition
  const [optimisticEntries, applyOptimisticToggle] = useOptimistic(
    entries,
    (current, payload: { id: string; paid: boolean }) =>
      current.map((e) =>
        e.id === payload.id
          ? {
              ...e,
              paid: payload.paid,
              paidAt: payload.paid ? new Date() : null,
            }
          : e
      )
  );
  const [, startToggleTransition] = useTransition();

  const handleTogglePaid = (entry: LedgerEntry) => {
    const next = !entry.paid;
    startToggleTransition(async () => {
      applyOptimisticToggle({ id: entry.id, paid: next });
      try {
        await onTogglePaid(entry, next);
      } catch {
        // useOptimistic rolls back อัตโนมัติเมื่อ transition จบ
      }
    });
  };

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const planMap = useMemo(() => planById(plans), [plans]);
  const activeCards = useMemo(() => cards.filter((c) => c.active), [cards]);

  // group entries by card (ใช้สรุปยอดในการ์ดเล็ก)
  const groupedByCard = useMemo(() => {
    const m = new Map<string, LedgerEntry[]>();
    for (const e of optimisticEntries) {
      const card = cardOfEntry(e, cardById, planMap);
      if (!card) continue;
      const arr = m.get(card.id) ?? [];
      arr.push(e);
      m.set(card.id, arr);
    }
    return m;
  }, [optimisticEntries, cardById, planMap]);

  const visibleEntries = useMemo(() => {
    if (!selectedCardId) return optimisticEntries;
    return optimisticEntries.filter((e) => {
      const card = cardOfEntry(e, cardById, planMap);
      return card?.id === selectedCardId;
    });
  }, [optimisticEntries, selectedCardId, cardById, planMap]);

  const summary = useMemo(() => {
    let total = 0;
    let paid = 0;
    let due = 0;
    for (const e of visibleEntries) {
      const amt = toNumber(e.amount);
      total += amt;
      if (e.paid) paid += amt;
      else due += amt;
    }
    return {
      total,
      paid,
      due,
      count: visibleEntries.length,
    };
  }, [visibleEntries]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthNav
          year={ym.year}
          month={ym.month}
          onPrev={onPrev}
          onNext={onNext}
        />
        <Button onClick={onAddCharge} disabled={activeCards.length === 0}>
          <Plus />
          เพิ่มรายการรูด
        </Button>
      </div>

      {activeCards.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีบัตร — สลับไปแท็บ &quot;บัตรของฉัน&quot; เพื่อเพิ่มบัตรก่อน
        </Card>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex items-stretch gap-5 scroll-px-4 px-4 py-3">
            {activeCards.map((c) => {
              const arr = groupedByCard.get(c.id) ?? [];
              const total = arr.reduce((s, e) => s + toNumber(e.amount), 0);
              const selected = selectedCardId === c.id;
              const theme = getCardColorTheme(c.color);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setSelectedCardId(selected ? null : c.id)
                  }
                  aria-pressed={selected}
                  className={cn(
                    "relative min-w-[220px] rounded-2xl p-4 text-left transition-all duration-200",
                    selected
                      ? "scale-[1.02] shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
                      : "shadow-sm hover:scale-[1.02] hover:shadow-md"
                  )}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                    color: theme.fg,
                  }}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transition-all duration-200",
                      selected ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    )}
                  >
                    <Check className="h-3 w-3 text-slate-900" strokeWidth={3} />
                  </span>
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="text-xs opacity-80">
                    {c.lastFourDigits ? `•••• ${c.lastFourDigits}` : "—"}
                  </div>
                  <div className="mt-3 text-xs opacity-80">ยอดบิลเดือนนี้</div>
                  {loading ? (
                    <>
                      <Skeleton className="h-7 w-28 bg-white/30" />
                      <Skeleton className="mt-1 h-3 w-20 bg-white/30" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold tabular-nums">
                        {formatMoney(total)}
                      </div>
                      <div className="mt-1 text-xs opacity-80">
                        {arr.length} รายการ
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {selectedCardId && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            แสดงเฉพาะบัตร: {cardById.get(selectedCardId)?.name ?? "—"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCardId(null)}
            className="h-7"
          >
            แสดงทุกใบ
          </Button>
        </div>
      )}

      {loading ? (
        <SummaryStripSkeleton />
      ) : activeCards.length > 0 && entries.length > 0 ? (
        <SummaryStrip
          items={[
            { label: "ยอดรวม", value: formatMoney(summary.total) },
            { label: "จ่ายแล้ว", value: formatMoney(summary.paid), tone: "paid" },
            { label: "ค้างจ่าย", value: formatMoney(summary.due), tone: "due" },
            { label: "จำนวนรายการ", value: String(summary.count) },
          ]}
        />
      ) : null}

      {loading ? (
        <RowSkeletonList count={5} />
      ) : visibleEntries.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีรายการเดือนนี้
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleEntries.map((e) => {
            const card = cardOfEntry(e, cardById, planMap);
            const plan =
              e.type === "CREDIT_CARD_INSTALLMENT" && e.sourceId
                ? planMap.get(e.sourceId)
                : undefined;
            return (
              <StatusRailRow
                key={e.id}
                entry={e}
                cardName={card?.name ?? "—"}
                plan={plan}
                onTogglePaid={() => handleTogglePaid(e)}
                onUpdateAmount={(amt) => onUpdateAmount(e, amt)}
                onUpdateInterestSplit={(p, i) => onUpdateInterestSplit(e, p, i)}
                onDelete={() => onDelete(e)}
                onJumpToPlan={onJumpToPlan}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusRailRow({
  entry,
  cardName,
  plan,
  onTogglePaid,
  onUpdateAmount,
  onUpdateInterestSplit,
  onDelete,
  onJumpToPlan,
}: {
  entry: LedgerEntry;
  cardName: string;
  plan?: InstallmentPlanWithProgress;
  onTogglePaid: () => void;
  onUpdateAmount: (amount: string) => void;
  onUpdateInterestSplit: (principal: string, interest: string) => void;
  onDelete: () => void;
  onJumpToPlan: (planId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [splitEditing, setSplitEditing] = useState(false);
  const [pDraft, setPDraft] = useState("");
  const [iDraft, setIDraft] = useState("");
  const isInstallment = entry.type === "CREDIT_CARD_INSTALLMENT";
  const accent = entry.paid ? STATUS.paid.bar : STATUS.due.bar;
  const canEditSplit = isInstallment && plan?.hasInterest && !entry.paid;
  const hasSplit = isInstallment && plan?.hasInterest && entry.principalAmount !== null;

  const startEdit = () => {
    setDraft(entry.amount ?? "");
    setEditing(true);
  };
  const commit = () => {
    const trimmed = draft.trim();
    const n = Number(trimmed);
    if (trimmed !== "" && Number.isFinite(n) && n >= 0) {
      onUpdateAmount(n.toFixed(2));
    }
    setEditing(false);
  };

  const startSplitEdit = () => {
    setPDraft(entry.principalAmount ?? "");
    setIDraft(entry.interestAmount ?? "");
    setSplitEditing(true);
  };
  const commitSplit = () => {
    const p = Number(pDraft);
    const i = Number(iDraft);
    if (Number.isFinite(p) && Number.isFinite(i) && p >= 0 && i >= 0) {
      onUpdateInterestSplit(p.toFixed(2), i.toFixed(2));
    }
    setSplitEditing(false);
  };

  const cur = plan ? installmentIndex(entry, plan) : 0;
  const total = plan?.totalInstallments ?? 0;

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
        <Checkbox checked={entry.paid} onCheckedChange={onTogglePaid} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "truncate font-medium",
                entry.paid && "line-through"
              )}
            >
              {entry.name}
            </span>
            {isInstallment && plan && (
              <button
                type="button"
                onClick={() => onJumpToPlan(plan.id)}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium hover:opacity-80"
                style={{
                  backgroundColor: STATUS.active.bg,
                  color: STATUS.active.text,
                }}
                aria-label="ไปแผนผ่อน"
              >
                ผ่อน {cur}/{total}
              </button>
            )}
          </div>
          <div className="text-xs text-muted-foreground">{cardName}</div>
          {splitEditing ? (
            <div className="mt-1.5 flex items-center gap-1">
              <Input
                autoFocus
                type="number"
                inputMode="decimal"
                placeholder="ต้น"
                value={pDraft}
                onChange={(e) => setPDraft(e.target.value)}
                className="h-7 w-24 text-right tabular-nums text-xs"
              />
              <span className="text-xs text-muted-foreground">+</span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="ดอก"
                value={iDraft}
                onChange={(e) => setIDraft(e.target.value)}
                onBlur={commitSplit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitSplit();
                  else if (e.key === "Escape") setSplitEditing(false);
                }}
                className="h-7 w-20 text-right tabular-nums text-xs"
              />
            </div>
          ) : hasSplit ? (
            <button
              type="button"
              onClick={canEditSplit ? startSplitEdit : undefined}
              className={cn(
                "mt-0.5 text-xs text-muted-foreground",
                canEditSplit && "hover:text-foreground cursor-pointer underline-offset-2 hover:underline"
              )}
            >
              ต้น {formatMoney(entry.principalAmount!)} + ดอก {formatMoney(entry.interestAmount ?? "0")}
            </button>
          ) : canEditSplit ? (
            <button
              type="button"
              onClick={startSplitEdit}
              className="mt-0.5 text-xs text-orange-600 hover:text-orange-700"
            >
              + กรอกต้น/ดอก
            </button>
          ) : null}
        </div>

        <StatusBadge
          status={entry.paid ? "paid" : "due"}
          className="hidden shrink-0 sm:inline-flex"
        />

        {isInstallment || editing ? (
          editing ? (
            <Input
              autoFocus
              type="number"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                else if (e.key === "Escape") setEditing(false);
              }}
              className="h-9 w-28 text-right tabular-nums"
            />
          ) : (
            <div
              className={cn(
                "min-w-[6rem] text-right text-base font-semibold tabular-nums",
                entry.paid && "line-through"
              )}
              style={{ color: accent }}
            >
              {formatMoney(entry.amount ?? "0")}
            </div>
          )
        ) : (
          <Button
            variant="ghost"
            onClick={startEdit}
            className={cn(
              "h-auto min-w-[6rem] justify-end px-2 py-1 text-base font-semibold tabular-nums",
              entry.paid && "line-through"
            )}
            style={{ color: accent }}
          >
            {formatMoney(entry.amount ?? "0")}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="ลบ"
          className="text-muted-foreground hover:text-destructive"
          disabled={isInstallment}
        >
          <Trash2 />
        </Button>
      </div>
    </Card>
  );
}

function SummaryStripSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-busy
      aria-live="polite"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="gap-1 bg-muted/40 p-3 shadow-none sm:p-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-28" />
        </Card>
      ))}
    </div>
  );
}

function RowSkeletonList({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="relative gap-2 overflow-hidden p-0 py-3 pr-3 pl-4 text-sm shadow-sm"
        >
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1 bg-foreground/10"
          />
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-5 w-14 rounded-full sm:block" />
            <Skeleton className="h-7 w-24" />
          </div>
        </Card>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatMoney, formatYearMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

import type {
  CreditCard,
  CreditCardInstallment,
  LedgerEntry,
  YearMonth,
} from "./types";

function toNumber(v: string | null): number {
  if (v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function planById(plans: CreditCardInstallment[]): Map<string, CreditCardInstallment> {
  return new Map(plans.map((p) => [p.id, p]));
}

function cardOfEntry(
  entry: LedgerEntry,
  cardById: Map<string, CreditCard>,
  planMap: Map<string, CreditCardInstallment>
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

export function StatementView({
  ym,
  cards,
  plans,
  entries,
  onPrev,
  onNext,
  onAddCharge,
  onTogglePaid,
  onUpdateAmount,
  onDelete,
}: {
  ym: YearMonth;
  cards: CreditCard[];
  plans: CreditCardInstallment[];
  entries: LedgerEntry[];
  onPrev: () => void;
  onNext: () => void;
  onAddCharge: () => void;
  onTogglePaid: (entry: LedgerEntry) => void;
  onUpdateAmount: (entry: LedgerEntry, amount: string) => void;
  onDelete: (entry: LedgerEntry) => void;
}) {
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const planMap = planById(plans);
  const activeCards = cards.filter((c) => c.active);

  // group entries by card
  const grouped = new Map<string, LedgerEntry[]>();
  for (const e of entries) {
    const card = cardOfEntry(e, cardById, planMap);
    if (!card) continue;
    const arr = grouped.get(card.id) ?? [];
    arr.push(e);
    grouped.set(card.id, arr);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onPrev} aria-label="เดือนก่อน">
            <ChevronLeft />
          </Button>
          <span className="text-xl font-bold tabular-nums">
            {formatYearMonth(ym.year, ym.month)}
          </span>
          <Button variant="ghost" size="icon" onClick={onNext} aria-label="เดือนถัดไป">
            <ChevronRight />
          </Button>
        </div>
        <Button onClick={onAddCharge} disabled={activeCards.length === 0}>
          <Plus />
          เพิ่มรายการรูด
        </Button>
      </div>

      {activeCards.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีบัตร — สลับไปแท็บ "บัตรของฉัน" เพื่อเพิ่มบัตรก่อน
        </Card>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-3">
            {activeCards.map((c) => {
              const arr = grouped.get(c.id) ?? [];
              const total = arr.reduce((s, e) => s + toNumber(e.amount), 0);
              return (
                <Card
                  key={c.id}
                  className="min-w-[260px] gap-2 px-5 py-4"
                >
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.lastFourDigits ? `****${c.lastFourDigits}` : "—"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    ยอดบิลเดือนนี้
                  </div>
                  <div className="text-2xl font-bold tabular-nums">
                    {formatMoney(total)}
                  </div>
                  {c.dueDate && (
                    <div className="text-xs text-muted-foreground">
                      ครบกำหนด: ทุกวันที่ {c.dueDate}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {entries.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีรายการเดือนนี้
        </Card>
      ) : (
        <Card className="gap-0 divide-y divide-border p-0">
          {entries.map((e) => {
            const card = cardOfEntry(e, cardById, planMap);
            return (
              <TransactionRow
                key={e.id}
                entry={e}
                cardName={card?.name ?? "—"}
                onTogglePaid={() => onTogglePaid(e)}
                onUpdateAmount={(amt) => onUpdateAmount(e, amt)}
                onDelete={() => onDelete(e)}
              />
            );
          })}
        </Card>
      )}
    </div>
  );
}

function TransactionRow({
  entry,
  cardName,
  onTogglePaid,
  onUpdateAmount,
  onDelete,
}: {
  entry: LedgerEntry;
  cardName: string;
  onTogglePaid: () => void;
  onUpdateAmount: (amount: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const isInstallment = entry.type === "CREDIT_CARD_INSTALLMENT";

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

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-3 text-sm",
        entry.paid && "opacity-60"
      )}
    >
      <Checkbox checked={entry.paid} onCheckedChange={onTogglePaid} />
      <Badge
        variant="outline"
        className={cn(
          "shrink-0",
          isInstallment
            ? "border-amber-300 bg-amber-50 text-amber-700"
            : "border-emerald-300 bg-emerald-50 text-emerald-700"
        )}
      >
        {isInstallment ? "🟡 ผ่อน" : "🟢 รูด"}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className={cn("truncate font-medium", entry.paid && "line-through")}>
          {entry.name}
        </div>
        <div className="text-xs text-muted-foreground">{cardName}</div>
      </div>
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
          <div className="min-w-[6rem] text-right text-base font-semibold tabular-nums">
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
  );
}

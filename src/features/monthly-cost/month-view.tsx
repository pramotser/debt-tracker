"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Info, Plus, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatYearMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CategoryBadge } from "@/components/shared/category-badge";
import type {
  Category,
  FixedCostTemplate,
  LedgerEntry,
  YearMonth,
} from "./types";

function toNumber(value: string | null): number {
  if (value === null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function MonthView({
  ym,
  items,
  loading = false,
  categories,
  pendingTemplates,
  bannerDismissed,
  onPrev,
  onNext,
  onTogglePaid,
  onUpdateAmount,
  onDelete,
  onAdd,
  onOpenImport,
  onDismissBanner,
}: {
  ym: YearMonth;
  items: LedgerEntry[];
  loading?: boolean;
  categories: Category[];
  pendingTemplates: FixedCostTemplate[];
  bannerDismissed: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePaid: (id: string) => void;
  onUpdateAmount: (id: string, amount: string | null) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onOpenImport: () => void;
  onDismissBanner: () => void;
}) {
  const total = items.reduce((s, i) => s + toNumber(i.amount), 0);
  const paidSum = items
    .filter((i) => i.paid)
    .reduce((s, i) => s + toNumber(i.amount), 0);
  const paidCount = items.filter((i) => i.paid).length;

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const showBanner = !loading && !bannerDismissed && pendingTemplates.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Month nav + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrev}
            aria-label="เดือนก่อน"
          >
            <ChevronLeft />
          </Button>
          <span className="text-xl font-bold tabular-nums">
            {formatYearMonth(ym.year, ym.month)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            aria-label="เดือนถัดไป"
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onAdd}>
            <Plus />
            เพิ่มรายการ
          </Button>
        </div>
      </div>

      {/* Summary — 3-card grid + progress */}
      {loading ? (
        <SummarySkeleton />
      ) : (
        <Card className="gap-4 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-background px-4 py-3">
              <Stat
                label="ยอดรวม"
                value={formatMoney(total)}
                hint={`${items.length} รายการ`}
              />
            </div>
            <div className="rounded-xl border bg-background px-4 py-3">
              <Stat
                label="จ่ายแล้ว"
                value={formatMoney(paidSum)}
                hint={`${paidCount} รายการ`}
                className="text-emerald-600"
              />
            </div>
            <div className="rounded-xl border bg-background px-4 py-3">
              <Stat
                label="ค้างจ่าย"
                value={formatMoney(total - paidSum)}
                hint={`${items.length - paidCount} รายการ`}
                className="text-orange-600"
              />
            </div>
          </div>
          {items.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Progress
                value={(paidCount / items.length) * 100}
                className="block [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-indicator]]:bg-emerald-500"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  จ่ายแล้ว {Math.round((paidCount / items.length) * 100)}%
                </span>
                <span>
                  {paidCount} / {items.length} รายการ
                </span>
              </div>
            </div>
          ) : null}
        </Card>
      )}

      {showBanner && (
        <Alert className="border-blue-200 bg-blue-50/60 text-blue-900">
          <Info className="text-blue-700" />
          <AlertDescription className="flex flex-col gap-2 text-blue-900 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span>
              มีรายการจ่ายประจำ active{" "}
              <span className="font-semibold">{pendingTemplates.length}</span>{" "}
              รายการ ยังไม่ได้ดึงเข้าเดือนนี้
            </span>
            <div className="flex justify-end gap-2 sm:flex-none">
              <Button variant="ghost" size="sm" onClick={onDismissBanner}>
                ข้าม
              </Button>
              <Button size="sm" onClick={onOpenImport}>
                ดึงรายการ
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Item list */}
      {loading ? (
        <RowSkeletonList count={5} />
      ) : items.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีรายการเดือนนี้
          {pendingTemplates.length > 0
            ? " — กด \"ดึงรายการ\" ด้านบนหรือ \"เพิ่มรายการ\""
            : " — กด \"เพิ่มรายการ\""}
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((i) => (
            <ItemRow
              key={i.id}
              item={i}
              category={categoryById.get(i.categoryId)}
              onTogglePaid={() => onTogglePaid(i.id)}
              onUpdateAmount={(amt) => onUpdateAmount(i.id, amt)}
              onDelete={() => onDelete(i.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <Card className="gap-4 p-4 sm:p-6" aria-busy aria-live="polite">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-xl border bg-background px-4 py-3"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </Card>
  );
}

function RowSkeletonList({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2.5" aria-busy aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3"
        >
          <div className="flex items-center gap-3 sm:contents">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-7 w-24" />
        </Card>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-xl font-semibold tabular-nums", className)}>
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

function ItemRow({
  item,
  category,
  onTogglePaid,
  onUpdateAmount,
  onDelete,
}: {
  item: LedgerEntry;
  category?: Category;
  onTogglePaid: () => void;
  onUpdateAmount: (amt: string | null) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEdit = () => {
    setEditing(true);
    setDraft(item.amount ?? "");
  };
  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === "") {
      onUpdateAmount(null);
    } else {
      const n = Number(trimmed);
      onUpdateAmount(Number.isFinite(n) ? n.toFixed(2) : null);
    }
    setEditing(false);
  };

  return (
    <Card
      className={cn(
        "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3",
        item.paid && "opacity-60"
      )}
    >
      <div className="flex items-center gap-3 sm:contents">
        <Checkbox checked={item.paid} onCheckedChange={onTogglePaid} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div
            className={cn(
              "truncate text-sm font-medium",
              item.paid && "line-through"
            )}
          >
            {item.name}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={category} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 sm:contents">
        {editing ? (
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
          <Button
            variant="ghost"
            onClick={startEdit}
            className={cn(
              "h-auto min-w-[7rem] justify-end px-2 py-1 text-base font-semibold tabular-nums",
              item.paid && "line-through",
              item.amount === null && "text-orange-600"
            )}
          >
            {item.amount === null ? "แตะเพื่อกรอก" : formatMoney(item.amount)}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="ลบรายการ"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Info, Pencil, Plus, Trash2 } from "lucide-react";

import { CategoryBadge } from "@/components/shared/category-badge";
import { NumberInput } from "@/components/shared/number-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { STATUS } from "@/components/shared/status-tokens";
import { MonthNav } from "@/components/layout/month-nav";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import type {
  Category,
  LedgerEntry,
  RecurringTemplate,
  YearMonth,
} from "./types";

function toNumber(value: string | null): number {
  if (value === null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export type AmountEditRequest = {
  ledgerId: string;
  templateId: string | null;
  templateHasAmount: boolean;
  nextAmount: string | null;
};

export function MonthView({
  ym,
  items,
  loading = false,
  templatesById,
  categories,
  pendingTemplates,
  bannerDismissed,
  onPrev,
  onNext,
  onAdd,
  onOpenImport,
  onDismissBanner,
  onTogglePaid,
  onRequestEditAmount,
  onDelete,
}: {
  ym: YearMonth;
  items: LedgerEntry[];
  loading?: boolean;
  templatesById: Map<string, RecurringTemplate>;
  categories: Category[];
  pendingTemplates: RecurringTemplate[];
  bannerDismissed: boolean;
  onPrev: () => void;
  onNext: () => void;
  onAdd: () => void;
  onOpenImport: () => void;
  onDismissBanner: () => void;
  onTogglePaid: (id: string) => void;
  onRequestEditAmount: (req: AmountEditRequest) => void;
  onDelete: (id: string) => void;
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
      <div className="flex items-center gap-3">
        <MonthNav
          year={ym.year}
          month={ym.month}
          onPrev={onPrev}
          onNext={onNext}
        />
        <Button onClick={onAdd} className="ml-auto">
          <Plus />
          เพิ่มรายการ
        </Button>
      </div>

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
              มีรายการประจำ active{" "}
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

      {loading ? (
        <RowSkeletonList count={5} />
      ) : items.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีรายการเดือนนี้
          {pendingTemplates.length > 0
            ? " — กด \"ดึงรายการ\" ด้านบน หรือ \"เพิ่มรายการ\""
            : " — กด \"เพิ่มรายการ\" ด้านบน"}
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((i) => {
            const template = i.sourceId
              ? templatesById.get(i.sourceId) ?? null
              : null;
            return (
              <ItemRow
                key={i.id}
                item={i}
                category={categoryById.get(i.categoryId)}
                template={template}
                onTogglePaid={() => onTogglePaid(i.id)}
                onRequestEditAmount={(nextAmount) =>
                  onRequestEditAmount({
                    ledgerId: i.id,
                    templateId: template?.id ?? null,
                    templateHasAmount:
                      template !== null && template.defaultAmount !== null,
                    nextAmount,
                  })
                }
                onDelete={() => onDelete(i.id)}
              />
            );
          })}
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
              <div className="flex gap-1.5">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="hidden h-5 w-14 rounded-full sm:block" />
            <Skeleton className="h-7 w-24" />
          </div>
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

function CycleBadge({ template }: { template: RecurringTemplate | null }) {
  if (!template) {
    return (
      <Badge variant="outline" className="border-gray-300 text-muted-foreground">
        เพิ่มเอง
      </Badge>
    );
  }
  if (template.billingCycle === "yearly") {
    return (
      <Badge
        variant="outline"
        className="border-amber-300 bg-amber-50 text-amber-700"
      >
        รายปี
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-blue-300 bg-blue-50 text-blue-700"
    >
      รายเดือน
    </Badge>
  );
}

function ItemRow({
  item,
  category,
  template,
  onTogglePaid,
  onRequestEditAmount,
  onDelete,
}: {
  item: LedgerEntry;
  category?: Category;
  template: RecurringTemplate | null;
  onTogglePaid: () => void;
  onRequestEditAmount: (nextAmount: string | null) => void;
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
    let nextAmount: string | null;
    if (trimmed === "") {
      nextAmount = null;
    } else {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 0) {
        setEditing(false);
        return;
      }
      nextAmount = n.toFixed(2);
    }
    if (nextAmount === item.amount) {
      setEditing(false);
      return;
    }
    onRequestEditAmount(nextAmount);
    setEditing(false);
  };

  const accent = item.paid ? STATUS.paid.bar : STATUS.due.bar;

  return (
    <Card
      className={cn(
        "relative gap-2 overflow-hidden p-0 py-3 pr-3 pl-4 text-sm shadow-sm",
        item.paid && "opacity-70"
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center gap-3">
        <Checkbox checked={item.paid} onCheckedChange={onTogglePaid} />
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate font-medium",
              item.paid && "line-through"
            )}
          >
            {item.name}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <CycleBadge template={template} />
            <CategoryBadge category={category} />
            {item.amount === null && (
              <Badge
                variant="outline"
                className="border-gray-300 text-muted-foreground"
              >
                กรอกทีหลัง
              </Badge>
            )}
          </div>
        </div>

        <StatusBadge
          status={item.paid ? "paid" : "due"}
          className="hidden shrink-0 sm:inline-flex"
        />

        {editing ? (
          <div
            className={cn(
              "min-w-[6rem] text-right text-base font-semibold tabular-nums",
              item.paid && "line-through"
            )}
            style={{ color: item.amount === null ? STATUS.due.bar : accent }}
          >
            {item.amount === null ? "—" : formatMoney(item.amount)}
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={startEdit}
            className={cn(
              "h-auto min-w-[6rem] justify-end gap-1.5 px-2 py-1 text-base font-semibold tabular-nums",
              item.paid && "line-through"
            )}
            style={{ color: item.amount === null ? STATUS.due.bar : accent }}
          >
            {item.amount === null ? "แตะเพื่อกรอก" : formatMoney(item.amount)}
            <Pencil className="size-3 shrink-0 opacity-60" />
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

      {editing && (
        <div className="mt-1 flex flex-col gap-3 rounded-lg border border-dashed bg-muted/30 px-3 py-3">
          <span className="text-xs font-medium text-muted-foreground">
            แก้ไขยอดเงิน
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <label
                htmlFor={`recurring-amount-${item.id}`}
                className="text-[11px] text-muted-foreground"
              >
                ยอดเงิน
              </label>
              <NumberInput
                id={`recurring-amount-${item.id}`}
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  else if (e.key === "Escape") setEditing(false);
                }}
                className="h-9 text-right tabular-nums"
              />
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
      )}
    </Card>
  );
}

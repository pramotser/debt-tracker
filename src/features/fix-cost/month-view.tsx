"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatMoney, formatYearMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CategoryBadge } from "./category-badge";
import type { Category, FixCostItem, YearMonth } from "./types";

export function MonthView({
  ym,
  isPast,
  closed,
  items,
  categories,
  onPrev,
  onNext,
  onTogglePaid,
  onUpdateAmount,
  onDelete,
  onCloseMonth,
  onAdd,
  onPullTemplates,
}: {
  ym: YearMonth;
  isPast: boolean;
  closed: boolean;
  items: FixCostItem[];
  categories: Category[];
  onPrev: () => void;
  onNext: () => void;
  onTogglePaid: (id: string) => void;
  onUpdateAmount: (id: string, amount: number | undefined) => void;
  onDelete: (id: string) => void;
  onCloseMonth: () => void;
  onAdd: () => void;
  onPullTemplates: () => void;
}) {
  const total = items.reduce((s, i) => s + (i.amount ?? 0), 0);
  const paidSum = items
    .filter((i) => i.paid)
    .reduce((s, i) => s + (i.amount ?? 0), 0);
  const paidCount = items.filter((i) => i.paid).length;

  const categoryById = new Map(categories.map((c) => [c.id, c]));

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
          {closed && (
            <Badge
              variant="outline"
              className="border-transparent bg-emerald-50 text-emerald-700"
            >
              ปิดรอบแล้ว
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onPullTemplates}
            disabled={isPast}
            title={isPast ? "เดือนอดีตเพิ่มเองเท่านั้น" : undefined}
          >
            <Download />
            ดึงจาก template
          </Button>
          <Button variant="outline" onClick={onCloseMonth} disabled={closed}>
            <Lock />
            ปิดรอบ
          </Button>
          <Button onClick={onAdd}>
            <Plus />
            เพิ่มรายการ
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card className="flex flex-wrap items-center gap-8 px-6 py-5">
        <Stat label="ยอดรวม" value={formatMoney(total)} />
        <Stat
          label="จ่ายแล้ว"
          value={formatMoney(paidSum)}
          className="text-emerald-600"
        />
        <Stat
          label="ค้างจ่าย"
          value={formatMoney(total - paidSum)}
          className="text-orange-600"
        />
        <div className="text-sm text-muted-foreground">
          {paidCount} รายการ / {items.length}
        </div>
      </Card>

      {/* Item list */}
      {items.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีรายการเดือนนี้ กด &quot;เพิ่มรายการ&quot;
          {!isPast && " หรือ \"ดึงจาก template\""}
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

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-xl font-semibold tabular-nums", className)}>
        {value}
      </div>
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
  item: FixCostItem;
  category?: Category;
  onTogglePaid: () => void;
  onUpdateAmount: (amt: number | undefined) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEdit = () => {
    setEditing(true);
    setDraft(item.amount?.toString() ?? "");
  };
  const commit = () => {
    const trimmed = draft.trim();
    const parsed = trimmed === "" ? undefined : Number(trimmed);
    onUpdateAmount(Number.isFinite(parsed) ? parsed : undefined);
    setEditing(false);
  };

  return (
    <Card
      className={cn(
        "flex flex-row items-center gap-3 px-4 py-3",
        item.paid && "opacity-60"
      )}
    >
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
        <div>
          <CategoryBadge category={category} />
        </div>
      </div>
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
        <button
          type="button"
          onClick={startEdit}
          className={cn(
            "min-w-[7rem] cursor-pointer rounded-md px-2 py-1 text-right text-base font-semibold tabular-nums transition-colors hover:bg-accent",
            item.paid && "line-through",
            item.amount === undefined && "text-orange-600"
          )}
        >
          {item.amount === undefined ? "แตะเพื่อกรอก" : formatMoney(item.amount)}
        </button>
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
    </Card>
  );
}

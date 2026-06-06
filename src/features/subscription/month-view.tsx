"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatMoney, formatYearMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CategoryBadge } from "./category-badge";
import type {
  Category,
  LedgerEntry,
  SubscriptionTemplate,
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
  templatesById,
  categories,
  pendingTemplates,
  bannerDismissed,
  onPrev,
  onNext,
  onOpenImport,
  onDismissBanner,
  onTogglePaid,
  onUpdateAmount,
  onDelete,
}: {
  ym: YearMonth;
  items: LedgerEntry[];
  templatesById: Map<string, SubscriptionTemplate>;
  categories: Category[];
  pendingTemplates: SubscriptionTemplate[];
  bannerDismissed: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenImport: () => void;
  onDismissBanner: () => void;
  onTogglePaid: (id: string) => void;
  onUpdateAmount: (id: string, amount: string) => void;
  onDelete: (id: string) => void;
}) {
  const total = items.reduce((s, i) => s + toNumber(i.amount), 0);
  const paidSum = items
    .filter((i) => i.paid)
    .reduce((s, i) => s + toNumber(i.amount), 0);
  const paidCount = items.filter((i) => i.paid).length;

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const showBanner = !bannerDismissed && pendingTemplates.length > 0;

  return (
    <div className="flex flex-col gap-4">
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

      <Card className="flex-row! flex-wrap items-center gap-x-10 gap-y-3 px-6 py-5">
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

      {showBanner && (
        <Card className="flex-row! items-center gap-3 border-blue-200 bg-blue-50/60 px-5 py-3">
          <div className="flex-1 text-sm text-blue-900">
            มีรายการสมัคร active{" "}
            <span className="font-semibold">{pendingTemplates.length}</span>{" "}
            รายการ ยังไม่ได้ดึงเข้าเดือนนี้
          </div>
          <Button variant="ghost" onClick={onDismissBanner}>
            ข้าม
          </Button>
          <Button onClick={onOpenImport}>ดึงรายการ</Button>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีรายการเดือนนี้
          {pendingTemplates.length > 0
            ? " — กด \"ดึงรายการ\" ด้านบนเพื่อนำเข้าจาก template"
            : " — เพิ่ม template ในแท็บ \"รายการสมัคร\" ก่อน"}
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((i) => (
            <ItemRow
              key={i.id}
              item={i}
              category={categoryById.get(i.categoryId)}
              template={
                i.sourceId ? templatesById.get(i.sourceId) ?? null : null
              }
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

function CycleBadge({ template }: { template: SubscriptionTemplate | null }) {
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
  onUpdateAmount,
  onDelete,
}: {
  item: LedgerEntry;
  category?: Category;
  template: SubscriptionTemplate | null;
  onTogglePaid: () => void;
  onUpdateAmount: (amt: string) => void;
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
    const n = Number(trimmed);
    if (trimmed !== "" && Number.isFinite(n) && n >= 0) {
      onUpdateAmount(n.toFixed(2));
    }
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
        <div className="flex flex-wrap items-center gap-1.5">
          <CycleBadge template={template} />
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
        <Button
          variant="ghost"
          onClick={startEdit}
          className={cn(
            "h-auto min-w-[7rem] justify-end px-2 py-1 text-base font-semibold tabular-nums",
            item.paid && "line-through"
          )}
        >
          {item.amount === null ? "—" : formatMoney(item.amount)}
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
    </Card>
  );
}

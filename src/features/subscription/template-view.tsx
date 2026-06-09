"use client";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CategoryBadge } from "@/components/shared/category-badge";
import type { Category, SubscriptionTemplate } from "./types";

const TH_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function formatRenew(template: SubscriptionTemplate): string | null {
  if (!template.renewDate) return null;
  const [, mStr, dStr] = template.renewDate.split("-");
  const day = Number(dStr);
  const monthIdx = Number(mStr) - 1;
  if (!Number.isInteger(day) || monthIdx < 0 || monthIdx > 11) return null;
  if (template.billingCycle === "yearly") {
    return `ต่อทุก ${day} ${TH_MONTHS[monthIdx]}`;
  }
  return `ตัดเงินทุกวันที่ ${day}`;
}

export function TemplateView({
  templates,
  categories,
  onAdd,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  templates: SubscriptionTemplate[];
  categories: Category[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const active = templates.filter((t) => t.active);
  const inactive = templates.filter((t) => !t.active);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          active {active.length} รายการ · inactive {inactive.length} รายการ
        </div>
        <Button onClick={onAdd}>
          <Plus />
          เพิ่มบริการ
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีบริการ — กด &quot;เพิ่มบริการ&quot;
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <Section title={`Active (${active.length})`}>
              {active.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t}
                  category={categoryById.get(t.categoryId)}
                  onEdit={() => onEdit(t.id)}
                  onToggleActive={() => onToggleActive(t.id)}
                  onDelete={() => onDelete(t.id)}
                />
              ))}
            </Section>
          )}
          {inactive.length > 0 && (
            <Section title={`Inactive (${inactive.length})`}>
              {inactive.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t}
                  category={categoryById.get(t.categoryId)}
                  onEdit={() => onEdit(t.id)}
                  onToggleActive={() => onToggleActive(t.id)}
                  onDelete={() => onDelete(t.id)}
                />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function TemplateRow({
  template,
  category,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  template: SubscriptionTemplate;
  category?: Category;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const renewLabel = formatRenew(template);
  return (
    <Card
      className={cn(
        "flex flex-row items-center gap-3 px-4 py-3",
        !template.active && "opacity-50"
      )}
    >
      <Switch
        checked={template.active}
        onCheckedChange={onToggleActive}
        aria-label="toggle active"
        className="data-checked:bg-emerald-500 data-unchecked:bg-rose-500"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="truncate text-sm font-medium">{template.name}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={
              template.billingCycle === "yearly"
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-blue-300 bg-blue-50 text-blue-700"
            }
          >
            {template.billingCycle === "yearly" ? "รายปี" : "รายเดือน"}
          </Badge>
          <CategoryBadge category={category} />
          {renewLabel && (
            <span className="text-xs text-muted-foreground">{renewLabel}</span>
          )}
        </div>
      </div>
      <div className="min-w-[7rem] text-right text-base font-semibold tabular-nums">
        {formatMoney(template.defaultAmount)}
      </div>
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
          <DropdownMenuItem onClick={onEdit}>
            <Pencil />
            แก้ไข
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 />
            ลบ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}

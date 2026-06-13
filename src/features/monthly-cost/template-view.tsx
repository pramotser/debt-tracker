"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CategoryBadge } from "@/components/shared/category-badge";
import type { Category, FixedCostTemplate } from "./types";

export function TemplateView({
  templates,
  categories,
  onAdd,
  onToggleActive,
  onUpdateDefaultAmount,
  onDelete,
}: {
  templates: FixedCostTemplate[];
  categories: Category[];
  onAdd: () => void;
  onToggleActive: (id: string) => void;
  onUpdateDefaultAmount: (id: string, amount: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={onAdd}>
          <Plus />
          เพิ่มรายการประจำ
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีรายการประจำ กด &quot;เพิ่มรายการประจำ&quot;
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {templates.map((t) => (
            <TemplateRow
              key={t.id}
              template={t}
              category={categoryById.get(t.categoryId)}
              onToggleActive={() => onToggleActive(t.id)}
              onUpdateDefaultAmount={(amt) =>
                onUpdateDefaultAmount(t.id, amt)
              }
              onDelete={() => onDelete(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateRow({
  template,
  category,
  onToggleActive,
  onUpdateDefaultAmount,
  onDelete,
}: {
  template: FixedCostTemplate;
  category?: Category;
  onToggleActive: () => void;
  onUpdateDefaultAmount: (amt: string | null) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEdit = () => {
    setEditing(true);
    setDraft(template.defaultAmount ?? "");
  };
  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === "") {
      onUpdateDefaultAmount(null);
    } else {
      const n = Number(trimmed);
      onUpdateDefaultAmount(Number.isFinite(n) ? n.toFixed(2) : null);
    }
    setEditing(false);
  };

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
        <Button
          variant="ghost"
          onClick={startEdit}
          className={cn(
            "h-auto min-w-[7rem] justify-end px-2 py-1 text-base font-semibold tabular-nums",
            template.defaultAmount === null && "text-muted-foreground"
          )}
        >
          {template.defaultAmount === null
            ? "กรอกเอง"
            : formatMoney(template.defaultAmount)}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label="ลบรายการจ่ายประจำ"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </Card>
  );
}

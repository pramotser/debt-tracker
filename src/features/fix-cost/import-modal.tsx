"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney, formatYearMonth } from "@/lib/format";

import { CategoryBadge } from "./category-badge";
import type { Category, FixedCostTemplate, YearMonth } from "./types";

export function ImportModal({
  open,
  onOpenChange,
  ym,
  pendingTemplates,
  categories,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ym: YearMonth;
  pendingTemplates: FixedCostTemplate[];
  categories: Category[];
  onSubmit: (templateIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  useEffect(() => {
    if (open) {
      setSelected(new Set(pendingTemplates.map((t) => t.id)));
    }
  }, [open, pendingTemplates]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSubmit = selected.size > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            ดึงรายการจ่ายประจำเข้าเดือน {formatYearMonth(ym.year, ym.month)}
          </DialogTitle>
          <DialogDescription>
            เลือกรายการที่ต้องการบันทึกลง — แก้ไขจำนวนได้ภายหลัง
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {pendingTemplates.map((t) => {
            const checked = selected.has(t.id);
            return (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(t.id)}
                />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm font-medium">{t.name}</span>
                  <CategoryBadge category={categoryById.get(t.categoryId)} />
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {t.defaultAmount === null ? "—" : formatMoney(t.defaultAmount)}
                </span>
              </label>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            ดึงเข้ารายการ ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

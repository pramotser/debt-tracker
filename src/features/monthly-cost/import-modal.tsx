"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatMoney, formatYearMonth } from "@/lib/format";

import { CategoryBadge } from "@/components/shared/category-badge";
import type { Category, FixedCostTemplate, YearMonth } from "./types";

function TemplateList({
  pendingTemplates,
  categoryById,
  selected,
  toggle,
}: {
  pendingTemplates: FixedCostTemplate[];
  categoryById: Map<string, Category>;
  selected: Set<string>;
  toggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {pendingTemplates.map((t) => {
        const checked = selected.has(t.id);
        return (
          <Label
            key={t.id}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 font-normal transition-colors hover:bg-accent"
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
          </Label>
        );
      })}
    </div>
  );
}

function SelectAllBar({
  total,
  selectedCount,
  onToggleAll,
}: {
  total: number;
  selectedCount: number;
  onToggleAll: () => void;
}) {
  const allSelected = selectedCount === total && total > 0;
  return (
    <div className="flex items-center justify-between border-b pb-2 text-sm">
      <span className="text-muted-foreground">
        เลือก {selectedCount}/{total} รายการ
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggleAll}
        className="h-7 px-2 text-xs"
      >
        {allSelected ? "ล้างทั้งหมด" : "เลือกทั้งหมด"}
      </Button>
    </div>
  );
}

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
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

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

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === pendingTemplates.length
        ? new Set()
        : new Set(pendingTemplates.map((t) => t.id))
    );
  };

  const selectedTotal = useMemo(() => {
    return pendingTemplates
      .filter((t) => selected.has(t.id))
      .reduce(
        (sum, t) => sum + (t.defaultAmount ? Number(t.defaultAmount) : 0),
        0
      );
  }, [pendingTemplates, selected]);

  const canSubmit = selected.size > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(Array.from(selected));
    onOpenChange(false);
  };

  const titleNode = (
    <span className="flex items-center gap-2">
      <Download className="size-4 text-primary" aria-hidden />
      ดึงรายการเข้าเดือน {formatYearMonth(ym.year, ym.month)}
    </span>
  );
  const descriptionText = "เลือกรายการที่ต้องการบันทึกลง — แก้ไขจำนวนได้ภายหลัง";
  const summaryText = `เลือก ${selected.size} รายการ · รวม ฿${formatMoney(selectedTotal.toFixed(2))}`;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] rounded-t-2xl px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="px-0 pt-0">
            <SheetTitle>{titleNode}</SheetTitle>
            <SheetDescription>{descriptionText}</SheetDescription>
          </SheetHeader>
          <SelectAllBar
            total={pendingTemplates.length}
            selectedCount={selected.size}
            onToggleAll={toggleAll}
          />
          <ScrollArea className="-mx-5 max-h-[55dvh] flex-1 px-5">
            <TemplateList
              pendingTemplates={pendingTemplates}
              categoryById={categoryById}
              selected={selected}
              toggle={toggle}
            />
          </ScrollArea>
          <div className="border-t pt-3 text-sm text-muted-foreground">
            {summaryText}
          </div>
          <SheetFooter className="flex-col gap-2 px-0 pb-0">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-11 w-full"
            >
              ดึงเข้ารายการ ({selected.size})
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-11 w-full"
            >
              ยกเลิก
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titleNode}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        <SelectAllBar
          total={pendingTemplates.length}
          selectedCount={selected.size}
          onToggleAll={toggleAll}
        />

        <ScrollArea className="max-h-[50vh] pr-2">
          <TemplateList
            pendingTemplates={pendingTemplates}
            categoryById={categoryById}
            selected={selected}
            toggle={toggle}
          />
        </ScrollArea>

        <div className="border-t pt-3 text-sm text-muted-foreground">
          {summaryText}
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

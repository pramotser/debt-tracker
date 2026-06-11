"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

import type { SubscriptionTemplate, YearMonth } from "./types";

type CycleFilter = "all" | "monthly" | "yearly";

function TemplateList({
  templates,
  selected,
  toggle,
}: {
  templates: SubscriptionTemplate[];
  selected: Set<string>;
  toggle: (id: string) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        ไม่มีรายการในตัวกรองนี้
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {templates.map((t) => {
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
              <Badge
                variant="outline"
                className={
                  t.billingCycle === "yearly"
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-blue-300 bg-blue-50 text-blue-700"
                }
              >
                {t.billingCycle === "yearly" ? "รายปี" : "รายเดือน"}
              </Badge>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {formatMoney(t.defaultAmount)}
            </span>
          </Label>
        );
      })}
    </div>
  );
}

function CycleFilterChips({
  value,
  onChange,
  counts,
}: {
  value: CycleFilter;
  onChange: (v: CycleFilter) => void;
  counts: { all: number; monthly: number; yearly: number };
}) {
  const options: { value: CycleFilter; label: string; count: number }[] = [
    { value: "all", label: "ทั้งหมด", count: counts.all },
    { value: "monthly", label: "รายเดือน", count: counts.monthly },
    { value: "yearly", label: "รายปี", count: counts.yearly },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="กรองตามรอบเรียกเก็บ"
      className="grid grid-cols-3 gap-2 rounded-md bg-muted p-1"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex h-9 items-center justify-center gap-1.5 rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{opt.label}</span>
            <span className="text-xs text-muted-foreground">{opt.count}</span>
          </button>
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
        disabled={total === 0}
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
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ym: YearMonth;
  pendingTemplates: SubscriptionTemplate[];
  onSubmit: (templateIds: string[]) => void;
}) {
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cycleFilter, setCycleFilter] = useState<CycleFilter>("all");

  useEffect(() => {
    if (open) {
      setSelected(new Set(pendingTemplates.map((t) => t.id)));
      setCycleFilter("all");
    }
  }, [open, pendingTemplates]);

  const counts = useMemo(
    () => ({
      all: pendingTemplates.length,
      monthly: pendingTemplates.filter((t) => t.billingCycle === "monthly")
        .length,
      yearly: pendingTemplates.filter((t) => t.billingCycle === "yearly")
        .length,
    }),
    [pendingTemplates]
  );

  const filteredTemplates = useMemo(() => {
    if (cycleFilter === "all") return pendingTemplates;
    return pendingTemplates.filter((t) => t.billingCycle === cycleFilter);
  }, [pendingTemplates, cycleFilter]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const filteredIds = filteredTemplates.map((t) => t.id);
      const allFilteredSelected =
        filteredIds.length > 0 && filteredIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const selectedInFiltered = useMemo(
    () => filteredTemplates.filter((t) => selected.has(t.id)).length,
    [filteredTemplates, selected]
  );

  const selectedTotal = useMemo(() => {
    return pendingTemplates
      .filter((t) => selected.has(t.id))
      .reduce((sum, t) => sum + Number(t.defaultAmount), 0);
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
      ดึงรายการสมัครเข้าเดือน {formatYearMonth(ym.year, ym.month)}
    </span>
  );
  const descriptionText = "เลือกรายการที่ต้องการบันทึกลง — แก้ไขจำนวนได้ภายหลัง";
  const summaryText = `เลือก ${selected.size} รายการ · รวม ฿${formatMoney(selectedTotal.toFixed(2))}`;

  const filterBlock = (
    <CycleFilterChips
      value={cycleFilter}
      onChange={setCycleFilter}
      counts={counts}
    />
  );
  const selectBar = (
    <SelectAllBar
      total={filteredTemplates.length}
      selectedCount={selectedInFiltered}
      onToggleAll={toggleAll}
    />
  );
  const listBlock = (
    <TemplateList
      templates={filteredTemplates}
      selected={selected}
      toggle={toggle}
    />
  );

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
          {filterBlock}
          {selectBar}
          <ScrollArea className="-mx-5 max-h-[50dvh] flex-1 px-5">
            {listBlock}
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

        {filterBlock}
        {selectBar}

        <ScrollArea className="max-h-[50vh] pr-2">{listBlock}</ScrollArea>

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

"use client";

import { useEffect, useState } from "react";

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
import { formatMoney, formatYearMonth } from "@/lib/format";

import type { SubscriptionTemplate, YearMonth } from "./types";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
            ดึงรายการสมัครเข้าเดือน {formatYearMonth(ym.year, ym.month)}
          </DialogTitle>
          <DialogDescription>
            เลือกรายการที่ต้องการบันทึกลง — แก้ไขจำนวนได้ภายหลัง
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-2">
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
        </ScrollArea>

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

"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SettleDraft = {
  settlementAmount: string;
  closeYear: number;
  closeMonth: number;
};

function parseAmount(raw: string): string | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n.toFixed(2) : null;
}

export function SettleDialog({
  open,
  onOpenChange,
  planName,
  defaultYm,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  defaultYm: { year: number; month: number };
  onSubmit: (draft: SettleDraft) => void;
}) {
  const [amount, setAmount] = useState("");
  const [year, setYear] = useState(String(defaultYm.year));
  const [month, setMonth] = useState(String(defaultYm.month));

  useEffect(() => {
    if (open) {
      setAmount("");
      setYear(String(defaultYm.year));
      setMonth(String(defaultYm.month));
    }
  }, [open, defaultYm]);

  const pAmount = parseAmount(amount);
  const nYear = Number(year);
  const nMonth = Number(month);

  const canSubmit =
    pAmount !== null &&
    Number.isInteger(nYear) &&
    nYear >= 1970 &&
    nYear <= 9999 &&
    Number.isInteger(nMonth) &&
    nMonth >= 1 &&
    nMonth <= 12;

  const handleSubmit = () => {
    if (!canSubmit || pAmount === null) return;
    onSubmit({
      settlementAmount: pAmount,
      closeYear: nYear,
      closeMonth: nMonth,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ปิดยอดก่อนกำหนด — {planName}</DialogTitle>
          <DialogDescription>
            งวดที่ยังไม่จ่ายจะถูกลบ และเพิ่ม 1 รายการ "ปิดก่อนกำหนด" แทน
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="settle-amount">ยอดปิด</Label>
            <Input
              id="settle-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="8000.00"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="settle-year">ปีที่ปิด</Label>
              <Input
                id="settle-year"
                type="number"
                inputMode="numeric"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settle-month">เดือนที่ปิด</Label>
              <Input
                id="settle-month"
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            ปิดยอด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

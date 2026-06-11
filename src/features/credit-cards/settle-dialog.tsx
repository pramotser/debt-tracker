"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

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

type FormProps = {
  amount: string;
  setAmount: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  month: string;
  setMonth: (v: string) => void;
  idPrefix: string;
};

function SettleFormFields({
  amount,
  setAmount,
  year,
  setYear,
  month,
  setMonth,
  idPrefix,
}: FormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-amount`}>ยอดปิด</Label>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
          >
            ฿
          </span>
          <Input
            id={`${idPrefix}-amount`}
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="8000.00"
            autoFocus
            className="pl-7"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-year`}>ปีที่ปิด</Label>
          <Input
            id={`${idPrefix}-year`}
            type="number"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-month`}>เดือนที่ปิด</Label>
          <Input
            id={`${idPrefix}-month`}
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
  );
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
  const isMobile = useIsMobile();
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

  const titleNode = (
    <span className="flex items-center gap-2">
      <AlertTriangle className="size-4 text-destructive" aria-hidden />
      ปิดยอดก่อนกำหนด
    </span>
  );
  const descriptionText = `${planName} — งวดที่ยังไม่จ่ายจะถูกลบ และเพิ่ม 1 รายการ "ปิดก่อนกำหนด" แทน`;

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
          <div className="flex-1 overflow-y-auto">
            <SettleFormFields
              amount={amount}
              setAmount={setAmount}
              year={year}
              setYear={setYear}
              month={month}
              setMonth={setMonth}
              idPrefix="settle-m"
            />
          </div>
          <SheetFooter className="flex-col gap-2 px-0 pb-0">
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-11 w-full"
            >
              ปิดยอด
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
        <SettleFormFields
          amount={amount}
          setAmount={setAmount}
          year={year}
          setYear={setYear}
          month={month}
          setMonth={setMonth}
          idPrefix="settle-d"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            ปิดยอด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

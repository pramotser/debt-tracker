"use client";

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Check, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { cn } from "@/lib/utils";

import type { Category, SubscriptionCycle, SubscriptionTemplate } from "./types";

export type TemplateDraft = {
  name: string;
  categoryId: string;
  defaultAmount: string;
  billingCycle: SubscriptionCycle;
  renewDate: string | null;
};

function parseAmount(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n.toFixed(2) : null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type FormProps = {
  name: string;
  setName: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  billingCycle: SubscriptionCycle;
  setBillingCycle: (v: SubscriptionCycle) => void;
  renewDate: string | null;
  setRenewDate: (v: string | null) => void;
  categories: Category[];
  idPrefix: string;
};

function TemplateFormFields({
  name,
  setName,
  amount,
  setAmount,
  categoryId,
  setCategoryId,
  billingCycle,
  setBillingCycle,
  renewDate,
  setRenewDate,
  categories,
  idPrefix,
}: FormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>ชื่อบริการ</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder="เช่น Netflix"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-amount`}>จำนวนเงิน</Label>
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
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>หมวดหมู่</Label>
        <div
          role="radiogroup"
          aria-label="หมวดหมู่"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {categories.map((c) => {
            const active = c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background text-foreground hover:bg-muted"
                )}
              >
                {active ? <Check className="size-3.5" aria-hidden /> : null}
                <span className="truncate">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>รูปแบบ</Label>
        <div
          role="radiogroup"
          aria-label="รูปแบบการเรียกเก็บ"
          className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1"
        >
          {(
            [
              { value: "monthly" as const, label: "รายเดือน" },
              { value: "yearly" as const, label: "รายปี" },
            ]
          ).map((opt) => {
            const active = billingCycle === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setBillingCycle(opt.value)}
                className={cn(
                  "flex h-9 items-center justify-center rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor={`${idPrefix}-renew`}
          className="flex items-center gap-1.5"
        >
          <CalendarIcon className="size-3.5 text-muted-foreground" aria-hidden />
          {billingCycle === "yearly" ? "วันต่ออายุ" : "วันตัดเงิน"}
        </Label>
        <DatePicker
          id={`${idPrefix}-renew`}
          value={renewDate}
          onChange={setRenewDate}
        />
        <span className="text-xs text-muted-foreground">
          {billingCycle === "yearly"
            ? "banner จะโผล่เฉพาะเดือนต่ออายุ"
            : "ใช้แสดงในรายการเดือน"}
        </span>
      </div>
    </div>
  );
}

export function TemplateDialog({
  open,
  onOpenChange,
  categories,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  initial?: SubscriptionTemplate | null;
  onSubmit: (draft: TemplateDraft) => void;
}) {
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [billingCycle, setBillingCycle] =
    useState<SubscriptionCycle>("monthly");
  const [renewDate, setRenewDate] = useState<string | null>(todayIso());

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setAmount(initial.defaultAmount);
      setCategoryId(initial.categoryId);
      setBillingCycle(initial.billingCycle);
      setRenewDate(initial.renewDate ?? todayIso());
    } else {
      setName("");
      setAmount("");
      setCategoryId(categories[0]?.id ?? "");
      setBillingCycle("monthly");
      setRenewDate(todayIso());
    }
  }, [open, initial, categories]);

  const parsedAmount = parseAmount(amount);
  const canSubmit =
    name.trim().length > 0 &&
    categoryId.length > 0 &&
    parsedAmount !== null;

  const handleSubmit = () => {
    if (!canSubmit || parsedAmount === null) return;
    onSubmit({
      name: name.trim(),
      categoryId,
      defaultAmount: parsedAmount,
      billingCycle,
      renewDate,
    });
    onOpenChange(false);
  };

  const titleNode = (
    <span className="flex items-center gap-2">
      {initial ? (
        <Pencil className="size-4 text-primary" aria-hidden />
      ) : (
        <Plus className="size-4 text-primary" aria-hidden />
      )}
      {initial ? "แก้ไขบริการ" : "เพิ่มบริการ"}
    </span>
  );
  const descriptionText = "บริการที่ตัดเงินประจำเดือน/ปี — ใช้ดึงเข้ารายการเดือนได้";

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
            <TemplateFormFields
              name={name}
              setName={setName}
              amount={amount}
              setAmount={setAmount}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              billingCycle={billingCycle}
              setBillingCycle={setBillingCycle}
              renewDate={renewDate}
              setRenewDate={setRenewDate}
              categories={categories}
              idPrefix="sub-m"
            />
          </div>
          <SheetFooter className="flex-col gap-2 px-0 pb-0">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-11 w-full"
            >
              บันทึก
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
        <TemplateFormFields
          name={name}
          setName={setName}
          amount={amount}
          setAmount={setAmount}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          renewDate={renewDate}
          setRenewDate={setRenewDate}
          categories={categories}
          idPrefix="sub-d"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

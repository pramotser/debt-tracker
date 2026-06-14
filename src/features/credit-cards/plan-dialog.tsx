"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { CategoryPickerGrid } from "@/components/shared/category-picker-grid";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { Category, CreditCard } from "./types";

type InterestMode = "zero" | "known-split" | "unknown-split";

export type PlanDraft = {
  creditCardId: string;
  categoryId: string;
  name: string;
  totalAmount: string;
  installmentAmount: string;
  installmentPrincipal: string | null;
  installmentInterest: string | null;
  totalInstallments: number;
  startYear: number;
  startMonth: number;
  hasInterest: boolean;
};

const INTEREST_OPTIONS: {
  value: InterestMode;
  label: string;
  helper: string;
  comingSoon?: boolean;
}[] = [
  { value: "zero", label: "ผ่อน 0%", helper: "ไม่มีดอกเบี้ย" },
  {
    value: "known-split",
    label: "มีดอกเบี้ย (รู้ split)",
    helper: "รองรับเงินต้น/ดอกเบี้ยต่องวด",
    comingSoon: true,
  },
  {
    value: "unknown-split",
    label: "มีดอกเบี้ย (split รู้ทีหลัง)",
    helper: "ยังไม่รู้ split ตอนสร้าง",
    comingSoon: true,
  },
];

function parseAmount(raw: string): string | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n.toFixed(2) : null;
}

function FieldSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card/40 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function MoneyInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
      >
        ฿
      </span>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-7"
      />
    </div>
  );
}

type FormState = {
  cardId: string;
  setCardId: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  totalAmount: string;
  setTotalAmount: (v: string) => void;
  installmentAmount: string;
  setInstallmentAmount: (v: string) => void;
  installments: string;
  setInstallments: (v: string) => void;
  startYear: string;
  setStartYear: (v: string) => void;
  startMonth: string;
  setStartMonth: (v: string) => void;
  mode: InterestMode;
  setMode: (v: InterestMode) => void;
  principal: string;
  setPrincipal: (v: string) => void;
  interest: string;
  setInterest: (v: string) => void;
  cards: CreditCard[];
  categories: Category[];
  idPrefix: string;
};

function PlanFormFields(s: FormState) {
  const autoSuggested = useMemo(() => {
    const total = Number(s.totalAmount);
    const n = Number(s.installments);
    if (!Number.isFinite(total) || total <= 0) return null;
    if (!Number.isInteger(n) || n <= 0) return null;
    return (total / n).toFixed(2);
  }, [s.totalAmount, s.installments]);

  const showAutoHint =
    autoSuggested !== null && autoSuggested !== s.installmentAmount;

  return (
    <div className="flex flex-col gap-4">
      <FieldSection title="ข้อมูลแผน">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${s.idPrefix}-card`}>บัตรเครดิต</Label>
          <Select value={s.cardId} onValueChange={(v) => v && s.setCardId(v)}>
            <SelectTrigger id={`${s.idPrefix}-card`} className="w-full">
              <SelectValue placeholder="เลือกบัตร">
                {(value: string | null) =>
                  value
                    ? s.cards.find((c) => c.id === value)?.name ?? value
                    : ""
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {s.cards.map((c) => (
                <SelectItem key={c.id} value={c.id} label={c.name}>
                  {c.name}
                  {c.lastFourDigits ? ` (****${c.lastFourDigits})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${s.idPrefix}-name`}>ชื่อแผน</Label>
          <Input
            id={`${s.idPrefix}-name`}
            placeholder="เช่น iPad Pro"
            value={s.name}
            onChange={(e) => s.setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>หมวดหมู่</Label>
          <CategoryPickerGrid
            categories={s.categories}
            value={s.categoryId}
            onChange={s.setCategoryId}
          />
        </div>
      </FieldSection>

      <FieldSection title="เงื่อนไขผ่อน">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${s.idPrefix}-total`}>ยอดรวม</Label>
            <MoneyInput
              id={`${s.idPrefix}-total`}
              value={s.totalAmount}
              onChange={s.setTotalAmount}
              placeholder="33860.00"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${s.idPrefix}-installment`}>ค่างวด/เดือน</Label>
            <MoneyInput
              id={`${s.idPrefix}-installment`}
              value={s.installmentAmount}
              onChange={s.setInstallmentAmount}
              placeholder="3386.00"
            />
            {showAutoHint ? (
              <button
                type="button"
                onClick={() => s.setInstallmentAmount(autoSuggested!)}
                className="self-start text-xs text-muted-foreground hover:text-foreground"
              >
                คำนวณ: ฿{formatMoney(autoSuggested!)}{" "}
                <span className="underline">ใช้ค่านี้</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${s.idPrefix}-installments`}>จำนวนงวด</Label>
            <Input
              id={`${s.idPrefix}-installments`}
              type="number"
              inputMode="numeric"
              value={s.installments}
              onChange={(e) => s.setInstallments(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${s.idPrefix}-year`}>เริ่มปี</Label>
            <Input
              id={`${s.idPrefix}-year`}
              type="number"
              inputMode="numeric"
              value={s.startYear}
              onChange={(e) => s.setStartYear(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${s.idPrefix}-month`}>เริ่มเดือน</Label>
            <Input
              id={`${s.idPrefix}-month`}
              type="number"
              inputMode="numeric"
              min={1}
              max={12}
              value={s.startMonth}
              onChange={(e) => s.setStartMonth(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>รูปแบบดอกเบี้ย</Label>
          <div
            role="radiogroup"
            aria-label="รูปแบบดอกเบี้ย"
            className="flex flex-col gap-2"
          >
            {INTEREST_OPTIONS.map((opt) => {
              const active = s.mode === opt.value;
              const disabled = opt.comingSoon === true;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-disabled={disabled}
                  disabled={disabled}
                  onClick={() => !disabled && s.setMode(opt.value)}
                  className={cn(
                    "flex items-start gap-3 rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    disabled
                      ? "cursor-not-allowed border-dashed border-input bg-muted/30 opacity-60"
                      : active
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-input bg-background hover:bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                      active && !disabled
                        ? "border-primary"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {active && !disabled ? (
                      <span className="size-1.5 rounded-full bg-primary" />
                    ) : null}
                  </span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {opt.label}
                      {disabled ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                          เร็วๆ นี้
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {opt.helper}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {s.mode === "known-split" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${s.idPrefix}-principal`}>เงินต้น/งวด</Label>
              <MoneyInput
                id={`${s.idPrefix}-principal`}
                value={s.principal}
                onChange={s.setPrincipal}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${s.idPrefix}-interest`}>ดอกเบี้ย/งวด</Label>
              <MoneyInput
                id={`${s.idPrefix}-interest`}
                value={s.interest}
                onChange={s.setInterest}
              />
            </div>
          </div>
        ) : null}
      </FieldSection>
    </div>
  );
}

export function PlanDialog({
  open,
  onOpenChange,
  cards,
  categories,
  defaultYm,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: CreditCard[];
  categories: Category[];
  defaultYm: { year: number; month: number };
  onSubmit: (draft: PlanDraft) => void;
}) {
  const isMobile = useIsMobile();
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interest, setInterest] = useState("");
  const [installments, setInstallments] = useState("10");
  const [startYear, setStartYear] = useState(String(defaultYm.year));
  const [startMonth, setStartMonth] = useState(String(defaultYm.month));
  const [mode, setMode] = useState<InterestMode>("zero");

  useEffect(() => {
    if (open) {
      setCardId(cards[0]?.id ?? "");
      setCategoryId(categories[0]?.id ?? "");
      setName("");
      setTotalAmount("");
      setInstallmentAmount("");
      setPrincipal("");
      setInterest("");
      setInstallments("10");
      setStartYear(String(defaultYm.year));
      setStartMonth(String(defaultYm.month));
      setMode("zero");
    }
  }, [open, cards, categories, defaultYm]);

  const pTotal = parseAmount(totalAmount);
  const pInstallment = parseAmount(installmentAmount);
  const pPrincipal = parseAmount(principal);
  const pInterest = parseAmount(interest);
  const nInstallments = Number(installments);
  const nYear = Number(startYear);
  const nMonth = Number(startMonth);

  const canSubmit =
    cardId.length > 0 &&
    categoryId.length > 0 &&
    name.trim().length > 0 &&
    pTotal !== null &&
    pInstallment !== null &&
    Number.isInteger(nInstallments) &&
    nInstallments >= 1 &&
    nInstallments <= 120 &&
    Number.isInteger(nYear) &&
    nYear >= 1970 &&
    nYear <= 9999 &&
    Number.isInteger(nMonth) &&
    nMonth >= 1 &&
    nMonth <= 12 &&
    (mode !== "known-split" || (pPrincipal !== null && pInterest !== null));

  const handleSubmit = () => {
    if (!canSubmit || pTotal === null || pInstallment === null) return;
    const hasInterest = mode !== "zero";
    const principalToSend =
      mode === "zero"
        ? pInstallment
        : mode === "known-split"
        ? pPrincipal
        : null;
    const interestToSend =
      mode === "zero"
        ? "0.00"
        : mode === "known-split"
        ? pInterest
        : null;

    onSubmit({
      creditCardId: cardId,
      categoryId,
      name: name.trim(),
      totalAmount: pTotal,
      installmentAmount: pInstallment,
      installmentPrincipal: principalToSend,
      installmentInterest: interestToSend,
      totalInstallments: nInstallments,
      startYear: nYear,
      startMonth: nMonth,
      hasInterest,
    });
    onOpenChange(false);
  };

  const formState: FormState = {
    cardId,
    setCardId,
    categoryId,
    setCategoryId,
    name,
    setName,
    totalAmount,
    setTotalAmount,
    installmentAmount,
    setInstallmentAmount,
    installments,
    setInstallments,
    startYear,
    setStartYear,
    startMonth,
    setStartMonth,
    mode,
    setMode,
    principal,
    setPrincipal,
    interest,
    setInterest,
    cards,
    categories,
    idPrefix: isMobile ? "plan-m" : "plan-d",
  };

  const titleNode = (
    <span className="flex items-center gap-2">
      <Plus className="size-4 text-primary" aria-hidden />
      เพิ่มแผนผ่อน
    </span>
  );
  const descriptionText = "สร้างแผน + ระบบจะ generate ทุกงวดให้อัตโนมัติ";

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] rounded-t-2xl px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="px-0 pt-0">
            <SheetTitle>{titleNode}</SheetTitle>
            <SheetDescription>{descriptionText}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <PlanFormFields {...formState} />
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{titleNode}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          <PlanFormFields {...formState} />
        </div>
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

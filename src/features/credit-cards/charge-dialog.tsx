"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { CategoryPickerGrid } from "@/components/shared/category-picker-grid";
import { NumberInput } from "@/components/shared/number-input";
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

import type { Category, CreditCard, YearMonth } from "./types";

export type ChargeDraft = {
  cardId: string;
  categoryId: string;
  name: string;
  amount: string;
  year: number;
  month: number;
};

function parseAmount(raw: string): string | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n.toFixed(2) : null;
}

type FormProps = {
  cardId: string;
  setCardId: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  cards: CreditCard[];
  categories: Category[];
  idPrefix: string;
};

function ChargeFormFields({
  cardId,
  setCardId,
  name,
  setName,
  categoryId,
  setCategoryId,
  amount,
  setAmount,
  cards,
  categories,
  idPrefix,
}: FormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-card`}>บัตร</Label>
        <Select value={cardId} onValueChange={(v) => v && setCardId(v)}>
          <SelectTrigger id={`${idPrefix}-card`} className="w-full">
            <SelectValue placeholder="เลือกบัตร">
              {(value: string | null) =>
                value ? cards.find((c) => c.id === value)?.name ?? value : ""
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {cards.map((c) => (
              <SelectItem key={c.id} value={c.id} label={c.name}>
                {c.name}
                {c.lastFourDigits ? ` (****${c.lastFourDigits})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>รายการ</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder="เช่น ค่าน้ำมัน Caltex"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-amount`}>ยอดเงิน</Label>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
          >
            ฿
          </span>
          <NumberInput
            id={`${idPrefix}-amount`}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>หมวดหมู่</Label>
        <CategoryPickerGrid
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
        />
      </div>
    </div>
  );
}

export function ChargeDialog({
  open,
  onOpenChange,
  cards,
  categories,
  ym,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: CreditCard[];
  categories: Category[];
  ym: YearMonth;
  onSubmit: (draft: ChargeDraft) => void;
}) {
  const isMobile = useIsMobile();
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) {
      setCardId(cards[0]?.id ?? "");
      setCategoryId(categories[0]?.id ?? "");
      setName("");
      setAmount("");
    }
  }, [open, cards, categories]);

  const pAmount = parseAmount(amount);
  const canSubmit =
    cardId.length > 0 &&
    categoryId.length > 0 &&
    name.trim().length > 0 &&
    pAmount !== null;

  const handleSubmit = () => {
    if (!canSubmit || pAmount === null) return;
    onSubmit({
      cardId,
      categoryId,
      name: name.trim(),
      amount: pAmount,
      year: ym.year,
      month: ym.month,
    });
    onOpenChange(false);
  };

  const titleNode = (
    <span className="flex items-center gap-2">
      <Plus className="size-4 text-primary" aria-hidden />
      เพิ่มรายการรูด
    </span>
  );
  const descriptionText =
    "รายการที่รูดบัตรเครดิตในเดือนนี้ — เพิ่มได้ทันที (ผ่อนชำระสร้างจากแท็บ \"รายการผ่อนชำระ\")";

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
          <div className="-mx-3 flex-1 overflow-y-auto px-3">
            <ChargeFormFields
              cardId={cardId}
              setCardId={setCardId}
              name={name}
              setName={setName}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              amount={amount}
              setAmount={setAmount}
              cards={cards}
              categories={categories}
              idPrefix="ch-m"
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
        <div className="-mx-3 max-h-[70vh] overflow-y-auto px-3">
          <ChargeFormFields
            cardId={cardId}
            setCardId={setCardId}
            name={name}
            setName={setName}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            amount={amount}
            setAmount={setAmount}
            cards={cards}
            categories={categories}
            idPrefix="ch-d"
          />
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

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มรายการรูด</DialogTitle>
          <DialogDescription>
            รายการที่รูดบัตรเครดิตในเดือนนี้ — เพิ่มได้ทันที (ผ่อนชำระสร้างจากหน้า /installment)
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ch-card">บัตร</Label>
            <Select value={cardId} onValueChange={(v) => v && setCardId(v)}>
              <SelectTrigger id="ch-card" className="w-full">
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
            <Label htmlFor="ch-name">รายการ</Label>
            <Input
              id="ch-name"
              placeholder="เช่น ค่าน้ำมัน Caltex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ch-category">หมวดหมู่</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => v && setCategoryId(v)}
            >
              <SelectTrigger id="ch-category" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value
                      ? categories.find((c) => c.id === value)?.name ?? value
                      : ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id} label={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ch-amount">ยอดเงิน</Label>
            <Input
              id="ch-amount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
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

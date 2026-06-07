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

function parseAmount(raw: string): string | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n.toFixed(2) : null;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>เพิ่มแผนผ่อน</DialogTitle>
          <DialogDescription>
            สร้างแผน + ระบบจะ generate ทุกงวดให้อัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan-card">บัตรเครดิต</Label>
            <Select value={cardId} onValueChange={(v) => v && setCardId(v)}>
              <SelectTrigger id="plan-card" className="w-full">
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
            <Label htmlFor="plan-name">ชื่อแผน</Label>
            <Input
              id="plan-name"
              placeholder="เช่น iPad Pro"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="plan-category">หมวดหมู่</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => v && setCategoryId(v)}
            >
              <SelectTrigger id="plan-category" className="w-full">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-total">ยอดรวม</Label>
              <Input
                id="plan-total"
                type="number"
                inputMode="decimal"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="33860.00"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-installment">ค่างวด/เดือน</Label>
              <Input
                id="plan-installment"
                type="number"
                inputMode="decimal"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                placeholder="3386.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-installments">จำนวนงวด</Label>
              <Input
                id="plan-installments"
                type="number"
                inputMode="numeric"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-year">เริ่มปี</Label>
              <Input
                id="plan-year"
                type="number"
                inputMode="numeric"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plan-month">เริ่มเดือน</Label>
              <Input
                id="plan-month"
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="plan-mode">รูปแบบดอกเบี้ย</Label>
            <Select
              value={mode}
              onValueChange={(v) => v && setMode(v as InterestMode)}
            >
              <SelectTrigger id="plan-mode" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value === "known-split"
                      ? "มีดอกเบี้ย (รู้ split)"
                      : value === "unknown-split"
                      ? "มีดอกเบี้ย (split รู้ทีหลัง)"
                      : "ผ่อน 0%"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zero" label="ผ่อน 0%">
                  ผ่อน 0%
                </SelectItem>
                <SelectItem value="known-split" label="มีดอกเบี้ย (รู้ split)">
                  มีดอกเบี้ย (รู้ split)
                </SelectItem>
                <SelectItem
                  value="unknown-split"
                  label="มีดอกเบี้ย (split รู้ทีหลัง)"
                >
                  มีดอกเบี้ย (split รู้ทีหลัง)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "known-split" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="plan-principal">เงินต้น/งวด</Label>
                <Input
                  id="plan-principal"
                  type="number"
                  inputMode="decimal"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="plan-interest">ดอกเบี้ย/งวด</Label>
                <Input
                  id="plan-interest"
                  type="number"
                  inputMode="decimal"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                />
              </div>
            </div>
          )}
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

"use client";

import { useEffect, useState } from "react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "แก้ไขบริการ" : "เพิ่มบริการ"}</DialogTitle>
          <DialogDescription>
            บริการที่ตัดเงินประจำเดือน/ปี — ใช้ดึงเข้ารายการเดือนได้
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-name">ชื่อบริการ</Label>
            <Input
              id="sub-name"
              placeholder="เช่น Netflix"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-amount">จำนวนเงิน</Label>
            <Input
              id="sub-amount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-category">หมวดหมู่</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => v && setCategoryId(v)}
            >
              <SelectTrigger id="sub-category" className="w-full">
                <SelectValue placeholder="เลือกหมวดหมู่">
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
            <Label htmlFor="sub-cycle">รูปแบบ</Label>
            <Select
              value={billingCycle}
              onValueChange={(v) =>
                v && setBillingCycle(v as SubscriptionCycle)
              }
            >
              <SelectTrigger id="sub-cycle" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value === "yearly" ? "รายปี" : "รายเดือน"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly" label="รายเดือน">
                  รายเดือน
                </SelectItem>
                <SelectItem value="yearly" label="รายปี">
                  รายปี
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-renew">
              {billingCycle === "yearly" ? "วันต่ออายุ" : "วันตัดเงิน"}{" "}
              <span className="text-xs text-muted-foreground">
                {billingCycle === "yearly"
                  ? "(banner จะโผล่เฉพาะเดือนต่ออายุ)"
                  : "(ใช้แสดงในรายการ)"}
              </span>
            </Label>
            <DatePicker
              id="sub-renew"
              value={renewDate}
              onChange={setRenewDate}
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

"use client";

import { useEffect, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Category } from "./types";

export type ItemDraft = {
  name: string;
  amount: string | null;
  categoryId: string;
  saveAsTemplate: boolean;
};

function parseAmount(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}

export function AddItemDialog({
  open,
  onOpenChange,
  categories,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSubmit: (draft: ItemDraft) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setAmount("");
      setCategoryId(categories[0]?.id ?? "");
      setSaveAsTemplate(false);
    }
  }, [open, categories]);

  const canSubmit = name.trim().length > 0 && categoryId.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      amount: parseAmount(amount),
      categoryId,
      saveAsTemplate,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มรายการ</DialogTitle>
          <DialogDescription>
            กรอกชื่อรายการและหมวดหมู่ จำนวนเงินใส่ทีหลังได้
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-name">ชื่อรายการ</Label>
            <Input
              id="item-name"
              placeholder="เช่น ค่าเช่าบ้าน"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-amount">
              จำนวนเงิน{" "}
              <span className="text-xs text-muted-foreground">
                (ไม่ใส่ก็ได้)
              </span>
            </Label>
            <Input
              id="item-amount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-category">หมวดหมู่</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => v && setCategoryId(v)}
            >
              <SelectTrigger id="item-category" className="w-full">
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
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={saveAsTemplate}
              onCheckedChange={(v) => setSaveAsTemplate(Boolean(v))}
            />
            <span>บันทึกเป็น template ด้วย</span>
          </label>
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

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

import type { Category } from "./types";

export type TemplateDraft = {
  name: string;
  amount?: number;
  categoryId: string;
};

export function AddTemplateDialog({
  open,
  onOpenChange,
  categories,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSubmit: (draft: TemplateDraft) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  useEffect(() => {
    if (open) {
      setName("");
      setAmount("");
      setCategoryId(categories[0]?.id ?? "");
    }
  }, [open, categories]);

  const canSubmit = name.trim().length > 0 && categoryId.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const parsed = amount.trim() === "" ? undefined : Number(amount);
    onSubmit({
      name: name.trim(),
      amount: Number.isFinite(parsed) ? parsed : undefined,
      categoryId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่ม Template</DialogTitle>
          <DialogDescription>
            template ใช้ดึงเข้ารายการเดือนได้ในภายหลัง
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tpl-name">ชื่อ</Label>
            <Input
              id="tpl-name"
              placeholder="เช่น Home loan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tpl-amount">
              จำนวนเงิน{" "}
              <span className="text-xs text-muted-foreground">
                (ไม่ใส่ก็ได้)
              </span>
            </Label>
            <Input
              id="tpl-amount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tpl-category">หมวดหมู่</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => v && setCategoryId(v)}
            >
              <SelectTrigger id="tpl-category" className="w-full">
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

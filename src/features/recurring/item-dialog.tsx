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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

import type { Category } from "./types";

export type ItemDraft = {
  name: string;
  amount: string | null;
  categoryId: string;
};

function parseAmount(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}

type FormProps = {
  name: string;
  setName: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  categories: Category[];
  idPrefix: string;
};

function ItemFormFields({
  name,
  setName,
  amount,
  setAmount,
  categoryId,
  setCategoryId,
  categories,
  idPrefix,
}: FormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>ชื่อรายการ</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder="เช่น ค่าข้าว ค่าหมอ"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-amount`}>
          จำนวนเงิน{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (ไม่ใส่ก็ได้)
          </span>
        </Label>
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
  const isMobile = useIsMobile();
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
    onSubmit({
      name: name.trim(),
      amount: parseAmount(amount),
      categoryId,
    });
    onOpenChange(false);
  };

  const titleNode = (
    <span className="flex items-center gap-2">
      <Plus className="size-4 text-primary" aria-hidden />
      เพิ่มรายการ
    </span>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[85dvh] gap-5 rounded-t-2xl px-5 pt-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="gap-1 px-0 pt-2 pb-0">
            <SheetTitle className="text-lg">{titleNode}</SheetTitle>
            <SheetDescription className="text-xs">
              รายการครั้งเดียว · ใส่ยอดทีหลังได้
            </SheetDescription>
          </SheetHeader>
          <div className="-mx-3 flex-1 overflow-y-auto px-3">
            <ItemFormFields
              name={name}
              setName={setName}
              amount={amount}
              setAmount={setAmount}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              categories={categories}
              idPrefix="item-m"
            />
          </div>
          <SheetFooter className="gap-1 px-0 pb-0">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-12 w-full text-base"
            >
              บันทึก
            </Button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mx-auto py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ยกเลิก
            </button>
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
          <DialogDescription>
            รายการครั้งเดียวสำหรับเดือนนี้ — จำนวนเงินใส่ทีหลังได้
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-3 max-h-[70vh] overflow-y-auto px-3">
          <ItemFormFields
            name={name}
            setName={setName}
            amount={amount}
            setAmount={setAmount}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            categories={categories}
            idPrefix="item-d"
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

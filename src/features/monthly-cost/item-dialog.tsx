"use client";

import { useEffect, useState } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";

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

type FormProps = {
  name: string;
  setName: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  saveAsTemplate: boolean;
  setSaveAsTemplate: (v: boolean) => void;
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
  saveAsTemplate,
  setSaveAsTemplate,
  categories,
  idPrefix,
}: FormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>ชื่อรายการ</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder="เช่น ค่าเช่าบ้าน"
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
        <CategoryPickerGrid
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
        />
      </div>

      <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/40 p-3">
        <div className="flex flex-col gap-0.5">
          <Label
            htmlFor={`${idPrefix}-tpl`}
            className="cursor-pointer text-sm font-medium"
          >
            บันทึกเป็นรายการจ่ายประจำ
          </Label>
          <span className="text-xs text-muted-foreground">
            ใช้ดึงเข้าเดือนหน้าได้
          </span>
        </div>
        <Switch
          id={`${idPrefix}-tpl`}
          checked={saveAsTemplate}
          onCheckedChange={(v) => setSaveAsTemplate(Boolean(v))}
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

  const titleNode = (
    <span className="flex items-center gap-2">
      <Plus className="size-4 text-primary" aria-hidden />
      เพิ่มรายการ
    </span>
  );
  const descriptionText = "กรอกชื่อรายการและหมวดหมู่ จำนวนเงินใส่ทีหลังได้";

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
            <ItemFormFields
              name={name}
              setName={setName}
              amount={amount}
              setAmount={setAmount}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              saveAsTemplate={saveAsTemplate}
              setSaveAsTemplate={setSaveAsTemplate}
              categories={categories}
              idPrefix="item-m"
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
        {/* wrapper overflow-y-auto = scroll container → sever min-content propagation
            กัน scroll-row ใน CategoryPickerGrid ดัน DialogContent ทะลุ max-w-sm */}
        <div className="max-h-[70vh] overflow-y-auto">
          <ItemFormFields
            name={name}
            setName={setName}
            amount={amount}
            setAmount={setAmount}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            saveAsTemplate={saveAsTemplate}
            setSaveAsTemplate={setSaveAsTemplate}
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

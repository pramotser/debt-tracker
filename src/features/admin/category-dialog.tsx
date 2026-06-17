"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Category } from "@/db/schema";
import { getCategoryIcon } from "@/lib/categories";

import { IconPicker } from "./icon-picker";

export type CategoryDraft = {
  name: string;
  icon: string;
  colorBg: string;
  colorFg: string;
  sortOrder: number;
  active: boolean;
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function CategoryFormFields({
  name,
  setName,
  icon,
  setIcon,
  colorBg,
  setColorBg,
  colorFg,
  setColorFg,
  sortOrder,
  setSortOrder,
  active,
  setActive,
  idPrefix,
}: {
  name: string;
  setName: (v: string) => void;
  icon: string;
  setIcon: (v: string) => void;
  colorBg: string;
  setColorBg: (v: string) => void;
  colorFg: string;
  setColorFg: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  active: boolean;
  setActive: (v: boolean) => void;
  idPrefix: string;
}) {
  const Icon = getCategoryIcon(icon || null);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex size-10 items-center justify-center rounded-full"
          style={{ backgroundColor: HEX_RE.test(colorBg) ? colorBg : "#94A3B8", color: HEX_RE.test(colorFg) ? colorFg : "#FFFFFF" }}
        >
          <Icon className="size-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">ตัวอย่าง</span>
          <span className="text-xs text-muted-foreground">
            ใช้บน badge ทั่วทุก module
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>ชื่อหมวดหมู่</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder="เช่น ค่าเดินทาง"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-icon`}>ไอคอน</Label>
        <IconPicker
          value={icon}
          onChange={setIcon}
          bgPreview={HEX_RE.test(colorBg) ? colorBg : "#94A3B8"}
          fgPreview={HEX_RE.test(colorFg) ? colorFg : "#FFFFFF"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-bg`}>สีพื้นหลัง</Label>
          <div className="flex items-center gap-2">
            <Input
              id={`${idPrefix}-bg`}
              placeholder="#94A3B8"
              value={colorBg}
              onChange={(e) => setColorBg(e.target.value)}
              maxLength={7}
              className="font-mono"
            />
            <input
              type="color"
              aria-label="เลือกสีพื้น"
              value={HEX_RE.test(colorBg) ? expandHex(colorBg) : "#94a3b8"}
              onChange={(e) => setColorBg(e.target.value)}
              className="size-9 cursor-pointer rounded border border-border"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-fg`}>สีตัวอักษร</Label>
          <div className="flex items-center gap-2">
            <Input
              id={`${idPrefix}-fg`}
              placeholder="#FFFFFF"
              value={colorFg}
              onChange={(e) => setColorFg(e.target.value)}
              maxLength={7}
              className="font-mono"
            />
            <input
              type="color"
              aria-label="เลือกสีตัวอักษร"
              value={HEX_RE.test(colorFg) ? expandHex(colorFg) : "#ffffff"}
              onChange={(e) => setColorFg(e.target.value)}
              className="size-9 cursor-pointer rounded border border-border"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-sort`}>ลำดับ</Label>
          <Input
            id={`${idPrefix}-sort`}
            type="number"
            inputMode="numeric"
            min={0}
            max={9999}
            placeholder="0"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-active`}>สถานะ</Label>
          <div className="flex h-9 items-center gap-2">
            <Switch
              id={`${idPrefix}-active`}
              checked={active}
              onCheckedChange={setActive}
            />
            <span className="text-sm text-muted-foreground">
              {active ? "ใช้งาน" : "ปิดใช้"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function expandHex(hex: string): string {
  if (hex.length === 4) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex;
}

export function CategoryDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Category | null;
  onSubmit: (draft: CategoryDraft) => void;
}) {
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("tag");
  const [colorBg, setColorBg] = useState("#94A3B8");
  const [colorFg, setColorFg] = useState("#FFFFFF");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setIcon(initial.icon);
      setColorBg(initial.colorBg);
      setColorFg(initial.colorFg);
      setSortOrder(String(initial.sortOrder));
      setActive(initial.active);
    } else {
      setName("");
      setIcon("tag");
      setColorBg("#94A3B8");
      setColorFg("#FFFFFF");
      setSortOrder("0");
      setActive(true);
    }
  }, [open, initial]);

  const sortNum = Number(sortOrder);
  const sortOk =
    sortOrder === "" || (Number.isInteger(sortNum) && sortNum >= 0);
  const bgOk = HEX_RE.test(colorBg);
  const fgOk = HEX_RE.test(colorFg);
  const canSubmit =
    name.trim().length > 0 && icon.trim().length > 0 && sortOk && bgOk && fgOk;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      icon: icon.trim(),
      colorBg,
      colorFg,
      sortOrder: sortOrder === "" ? 0 : sortNum,
      active,
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
      {initial ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
    </span>
  );
  const descriptionText = initial
    ? "ชื่อ ไอคอน สี และสถานะใช้งาน"
    : "id จะถูกสร้างจากชื่ออัตโนมัติ (c-<slug>)";

  const fields = (idPrefix: string) => (
    <CategoryFormFields
      name={name}
      setName={setName}
      icon={icon}
      setIcon={setIcon}
      colorBg={colorBg}
      setColorBg={setColorBg}
      colorFg={colorFg}
      setColorFg={setColorFg}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      active={active}
      setActive={setActive}
      idPrefix={idPrefix}
    />
  );

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
            {fields("cat-m")}
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
        {fields("cat-d")}
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

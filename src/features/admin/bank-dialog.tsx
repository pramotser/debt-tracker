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

import type { Bank } from "@/db/schema";

export type BankDraft = {
  shortName: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

type FormProps = {
  shortName: string;
  setShortName: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  active: boolean;
  setActive: (v: boolean) => void;
  idPrefix: string;
  showShortName: boolean;
};

function BankFormFields({
  shortName,
  setShortName,
  name,
  setName,
  sortOrder,
  setSortOrder,
  active,
  setActive,
  idPrefix,
  showShortName,
}: FormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-short`}>ชื่อย่อ (chip)</Label>
        <Input
          id={`${idPrefix}-short`}
          placeholder="เช่น KBank"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          maxLength={20}
          autoFocus
        />
        {showShortName && (
          <span className="text-xs text-muted-foreground">
            แสดงบน chip · 1-20 ตัวอักษร
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>ชื่อเต็ม</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder="เช่น ธนาคารกสิกรไทย"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
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

export function BankDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Bank | null;
  onSubmit: (draft: BankDraft) => void;
}) {
  const isMobile = useIsMobile();
  const [shortName, setShortName] = useState("");
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setShortName(initial.shortName);
      setName(initial.name);
      setSortOrder(String(initial.sortOrder));
      setActive(initial.active);
    } else {
      setShortName("");
      setName("");
      setSortOrder("0");
      setActive(true);
    }
  }, [open, initial]);

  const sortNum = Number(sortOrder);
  const sortOk =
    sortOrder === "" || (Number.isInteger(sortNum) && sortNum >= 0);
  const canSubmit =
    shortName.trim().length > 0 && name.trim().length > 0 && sortOk;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      shortName: shortName.trim(),
      name: name.trim(),
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
      {initial ? "แก้ไขธนาคาร" : "เพิ่มธนาคาร"}
    </span>
  );
  const descriptionText = initial
    ? "ชื่อย่อ ชื่อเต็ม ลำดับ และสถานะใช้งาน"
    : "id จะถูกสร้างจากชื่อย่ออัตโนมัติ (b-<short>)";

  const fields = (idPrefix: string) => (
    <BankFormFields
      shortName={shortName}
      setShortName={setShortName}
      name={name}
      setName={setName}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      active={active}
      setActive={setActive}
      idPrefix={idPrefix}
      showShortName={!initial}
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
            {fields("bank-m")}
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
        {fields("bank-d")}
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

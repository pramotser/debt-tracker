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

import type { Bank, CreditCard } from "./types";

export type CardDraft = {
  name: string;
  bankId: string;
  lastFourDigits: string | null;
  statementDate: number | null;
  dueDate: number | null;
};

function parseDay(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
}

type FormProps = {
  banks: Bank[];
  name: string;
  setName: (v: string) => void;
  bankId: string;
  setBankId: (v: string) => void;
  digits: string;
  setDigits: (v: string) => void;
  statementDay: string;
  setStatementDay: (v: string) => void;
  dueDay: string;
  setDueDay: (v: string) => void;
  idPrefix: string;
};

function CardFormFields({
  banks,
  name,
  setName,
  bankId,
  setBankId,
  digits,
  setDigits,
  statementDay,
  setStatementDay,
  dueDay,
  setDueDay,
  idPrefix,
}: FormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-bank`}>ธนาคาร</Label>
        <Select value={bankId} onValueChange={(v) => v && setBankId(v)}>
          <SelectTrigger id={`${idPrefix}-bank`} className="w-full">
            <SelectValue>
              {(value: string | null) =>
                value ? banks.find((b) => b.id === value)?.name ?? value : ""
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {banks.map((b) => (
              <SelectItem key={b.id} value={b.id} label={b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-name`}>ชื่อบัตร</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder="เช่น UOB Premier"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-digits`}>
          4 ตัวท้าย{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (ไม่ใส่ก็ได้)
          </span>
        </Label>
        <Input
          id={`${idPrefix}-digits`}
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
          className="font-mono tracking-[0.5em] text-center"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-stmt`}>วันตัดรอบบิล</Label>
          <Input
            id={`${idPrefix}-stmt`}
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            placeholder="10"
            value={statementDay}
            onChange={(e) => setStatementDay(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">วันที่ 1-31</span>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-due`}>วันครบกำหนดชำระ</Label>
          <Input
            id={`${idPrefix}-due`}
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            placeholder="28"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">วันที่ 1-31</span>
        </div>
      </div>
    </div>
  );
}

export function CardDialog({
  open,
  onOpenChange,
  banks,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banks: Bank[];
  initial?: CreditCard | null;
  onSubmit: (draft: CardDraft) => void;
}) {
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [bankId, setBankId] = useState(banks[0]?.id ?? "");
  const [digits, setDigits] = useState("");
  const [statementDay, setStatementDay] = useState("");
  const [dueDay, setDueDay] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setBankId(initial.bankId);
      setDigits(initial.lastFourDigits ?? "");
      setStatementDay(
        initial.statementDate ? String(initial.statementDate) : ""
      );
      setDueDay(initial.dueDate ? String(initial.dueDate) : "");
    } else {
      setName("");
      setBankId(banks[0]?.id ?? "");
      setDigits("");
      setStatementDay("");
      setDueDay("");
    }
  }, [open, initial, banks]);

  const digitsOk = digits === "" || /^\d{4}$/.test(digits);
  const sd = parseDay(statementDay);
  const dd = parseDay(dueDay);
  const sdOk = statementDay === "" || sd !== null;
  const ddOk = dueDay === "" || dd !== null;

  const canSubmit =
    name.trim().length > 0 && bankId.length > 0 && digitsOk && sdOk && ddOk;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      bankId,
      lastFourDigits: digits === "" ? null : digits,
      statementDate: sd,
      dueDate: dd,
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
      {initial ? "แก้ไขบัตรเครดิต" : "เพิ่มบัตรเครดิต"}
    </span>
  );
  const descriptionText = "บัตรนี้จะใช้ผูกกับยอดรูดและแผนผ่อนชำระ";

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
            <CardFormFields
              banks={banks}
              name={name}
              setName={setName}
              bankId={bankId}
              setBankId={setBankId}
              digits={digits}
              setDigits={setDigits}
              statementDay={statementDay}
              setStatementDay={setStatementDay}
              dueDay={dueDay}
              setDueDay={setDueDay}
              idPrefix="card-m"
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
        <CardFormFields
          banks={banks}
          name={name}
          setName={setName}
          bankId={bankId}
          setBankId={setBankId}
          digits={digits}
          setDigits={setDigits}
          statementDay={statementDay}
          setStatementDay={setStatementDay}
          dueDay={dueDay}
          setDueDay={setDueDay}
          idPrefix="card-d"
        />
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

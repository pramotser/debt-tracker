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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initial ? "แก้ไขบัตรเครดิต" : "เพิ่มบัตรเครดิต"}
          </DialogTitle>
          <DialogDescription>
            บัตรนี้จะใช้ผูกกับยอดรูดและแผนผ่อนชำระ
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="card-bank">ธนาคาร</Label>
            <Select value={bankId} onValueChange={(v) => v && setBankId(v)}>
              <SelectTrigger id="card-bank" className="w-full">
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
            <Label htmlFor="card-name">ชื่อบัตร</Label>
            <Input
              id="card-name"
              placeholder="เช่น UOB Premier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="card-digits">
              4 ตัวท้าย{" "}
              <span className="text-xs text-muted-foreground">(ไม่ใส่ก็ได้)</span>
            </Label>
            <Input
              id="card-digits"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              value={digits}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-stmt">วันตัดรอบบิล</Label>
              <Input
                id="card-stmt"
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                placeholder="10"
                value={statementDay}
                onChange={(e) => setStatementDay(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-due">วันครบกำหนดชำระ</Label>
              <Input
                id="card-due"
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                placeholder="28"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>
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

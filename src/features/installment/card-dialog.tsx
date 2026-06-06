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

import type { Bank } from "./types";

export type CardDraft = {
  name: string;
  bankId: string;
  lastFourDigits: string | null;
};

export function CardDialog({
  open,
  onOpenChange,
  banks,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banks: Bank[];
  onSubmit: (draft: CardDraft) => void;
}) {
  const [name, setName] = useState("");
  const [bankId, setBankId] = useState(banks[0]?.id ?? "");
  const [digits, setDigits] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setBankId(banks[0]?.id ?? "");
      setDigits("");
    }
  }, [open, banks]);

  const digitsOk = digits === "" || /^\d{4}$/.test(digits);
  const canSubmit = name.trim().length > 0 && bankId.length > 0 && digitsOk;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      bankId,
      lastFourDigits: digits === "" ? null : digits,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มบัตรเครดิต</DialogTitle>
          <DialogDescription>
            บัตรที่ใช้ผูกกับแผนผ่อนชำระ — last 4 digits ใส่/ไม่ใส่ก็ได้
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

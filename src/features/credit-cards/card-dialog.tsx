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
import { BankPicker } from "./bank-picker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CARD_COLOR_THEMES,
  CARD_COLORS,
  CARD_NETWORKS,
  getNetworkLabel,
  type CardColor,
  type CardNetwork,
} from "@/lib/banks";
import { cn } from "@/lib/utils";

import type { Bank, CreditCard } from "./types";

export type CardDraft = {
  name: string;
  bankId: string;
  lastFourDigits: string | null;
  cardNetwork: CardNetwork | null;
  statementDate: number | null;
  dueDate: number | null;
  color: CardColor;
};

const NETWORK_NONE = "__none";

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
  network: string;
  setNetwork: (v: string) => void;
  statementDay: string;
  setStatementDay: (v: string) => void;
  dueDay: string;
  setDueDay: (v: string) => void;
  color: CardColor;
  setColor: (v: CardColor) => void;
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
  network,
  setNetwork,
  statementDay,
  setStatementDay,
  dueDay,
  setDueDay,
  color,
  setColor,
  idPrefix,
}: FormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>ธนาคาร</Label>
        <BankPicker banks={banks} value={bankId} onChange={setBankId} />
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

      <div className="grid grid-cols-2 gap-3">
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
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-network`}>
            เครือข่าย{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (ไม่ใส่ก็ได้)
            </span>
          </Label>
          <Select value={network} onValueChange={(v) => v && setNetwork(v)}>
            <SelectTrigger id={`${idPrefix}-network`} className="w-full">
              <SelectValue>
                {(value: string | null) =>
                  !value || value === NETWORK_NONE
                    ? "ไม่ระบุ"
                    : getNetworkLabel(value) ?? value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NETWORK_NONE} label="ไม่ระบุ">
                ไม่ระบุ
              </SelectItem>
              {CARD_NETWORKS.map((n) => (
                <SelectItem key={n} value={n} label={getNetworkLabel(n) ?? n}>
                  {getNetworkLabel(n)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>สีการ์ด</Label>
        <div className="flex flex-wrap gap-2">
          {CARD_COLORS.map((c) => {
            const theme = CARD_COLOR_THEMES[c];
            const selected = color === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={theme.label}
                aria-pressed={selected}
                className={cn(
                  "size-9 rounded-full border-2 transition-all",
                  selected
                    ? "border-foreground ring-2 ring-offset-2 ring-foreground/30"
                    : "border-transparent hover:scale-105"
                )}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                }}
              />
            );
          })}
        </div>
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
  const [network, setNetwork] = useState<string>(NETWORK_NONE);
  const [statementDay, setStatementDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [color, setColor] = useState<CardColor>("blue");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setBankId(initial.bankId);
      setDigits(initial.lastFourDigits ?? "");
      setNetwork(initial.cardNetwork ?? NETWORK_NONE);
      setStatementDay(
        initial.statementDate ? String(initial.statementDate) : ""
      );
      setDueDay(initial.dueDate ? String(initial.dueDate) : "");
      setColor((initial.color as CardColor) ?? "blue");
    } else {
      setName("");
      setBankId(banks[0]?.id ?? "");
      setDigits("");
      setNetwork(NETWORK_NONE);
      setStatementDay("");
      setDueDay("");
      setColor("blue");
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
      cardNetwork:
        network === NETWORK_NONE ? null : (network as CardNetwork),
      statementDate: sd,
      dueDate: dd,
      color,
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
          <div className="-mx-3 flex-1 overflow-y-auto px-3">
            <CardFormFields
              banks={banks}
              name={name}
              setName={setName}
              bankId={bankId}
              setBankId={setBankId}
              digits={digits}
              setDigits={setDigits}
              network={network}
              setNetwork={setNetwork}
              statementDay={statementDay}
              setStatementDay={setStatementDay}
              dueDay={dueDay}
              setDueDay={setDueDay}
              color={color}
              setColor={setColor}
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
          network={network}
          setNetwork={setNetwork}
          statementDay={statementDay}
          setStatementDay={setStatementDay}
          dueDay={dueDay}
          setDueDay={setDueDay}
          color={color}
          setColor={setColor}
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

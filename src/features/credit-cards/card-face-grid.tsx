"use client";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { getCardColorTheme, getNetworkLabel } from "@/lib/banks";
import { cn } from "@/lib/utils";

import type { Bank, CreditCard } from "./types";

export function CardFaceGrid({
  cards,
  banks,
  onAdd,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  cards: CreditCard[];
  banks: Bank[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const active = cards.filter((c) => c.active);
  const inactive = cards.filter((c) => !c.active);
  const bankMap = new Map(banks.map((b) => [b.id, b]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          ใช้งาน {active.length} · ปิดใช้งาน {inactive.length}
        </div>
        <Button onClick={onAdd}>
          <Plus />
          เพิ่มบัตร
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีบัตร — กด &quot;เพิ่มบัตร&quot;
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {active.length > 0 && (
            <Section title={`ใช้งานอยู่ (${active.length})`}>
              {active.map((c) => (
                <CardFace
                  key={c.id}
                  card={c}
                  bank={bankMap.get(c.bankId)}
                  onEdit={() => onEdit(c.id)}
                  onToggleActive={() => onToggleActive(c.id)}
                  onDelete={() => onDelete(c.id)}
                />
              ))}
            </Section>
          )}
          {inactive.length > 0 && (
            <Section title={`ปิดใช้งาน (${inactive.length})`}>
              {inactive.map((c) => (
                <CardFace
                  key={c.id}
                  card={c}
                  bank={bankMap.get(c.bankId)}
                  onEdit={() => onEdit(c.id)}
                  onToggleActive={() => onToggleActive(c.id)}
                  onDelete={() => onDelete(c.id)}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
        {children}
      </div>
    </div>
  );
}

function CardFace({
  card,
  bank,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  card: CreditCard;
  bank?: Bank;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const theme = getCardColorTheme(card.color);
  const bankLabel = bank?.shortName ?? card.bankId;
  const networkLabel = getNetworkLabel(card.cardNetwork);
  const last4 = card.lastFourDigits;
  const masked = last4 ? `•••• •••• •••• ${last4}` : "•••• ••••";

  return (
    <div
      style={{
        backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
        color: theme.fg,
      }}
      className={cn(
        "flex min-h-[150px] flex-col justify-between rounded-2xl p-4 shadow-sm transition-opacity",
        !card.active && "opacity-55"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          aria-hidden
          className="h-[22px] w-[30px] rounded-md bg-white/15"
        />
        <div className="flex items-center gap-1">
          <Switch
            checked={card.active}
            onCheckedChange={onToggleActive}
            aria-label="toggle active"
            className="data-checked:bg-emerald-500 data-unchecked:bg-white/25"
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="เมนู"
                  style={{ color: theme.fg }}
                  className="h-8 w-8 hover:bg-white/15"
                >
                  <MoreHorizontal />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil />
                แก้ไข
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 />
                ลบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="truncate text-base font-semibold">{card.name}</div>
        <div className="font-mono text-sm tracking-[0.18em] opacity-90 whitespace-nowrap">
          {masked}
        </div>
        <div className="flex items-end justify-between gap-2 text-xs">
          <div className="min-w-0 truncate opacity-85">
            {bankLabel}
            {card.statementDate ? ` · ตัดรอบ ${card.statementDate}` : ""}
          </div>
          {networkLabel && (
            <Badge
              variant="outline"
              style={{ color: theme.fg, borderColor: "currentColor" }}
              className="border bg-transparent text-[10px] font-semibold uppercase tracking-wider"
            >
              {networkLabel}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

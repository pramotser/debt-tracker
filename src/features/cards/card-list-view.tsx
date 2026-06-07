"use client";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type { Bank, CreditCard } from "./types";

export function CardListView({
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
  const bankById = new Map(banks.map((b) => [b.id, b]));
  const active = cards.filter((c) => c.active);
  const inactive = cards.filter((c) => !c.active);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          active {active.length} · inactive {inactive.length}
        </div>
        <Button onClick={onAdd}>
          <Plus />
          เพิ่มบัตร
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีบัตร — กด &quot;เพิ่มบัตร&quot;
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <Section title={`Active (${active.length})`}>
              {active.map((c) => (
                <CardRow
                  key={c.id}
                  card={c}
                  bank={bankById.get(c.bankId)}
                  onEdit={() => onEdit(c.id)}
                  onToggleActive={() => onToggleActive(c.id)}
                  onDelete={() => onDelete(c.id)}
                />
              ))}
            </Section>
          )}
          {inactive.length > 0 && (
            <Section title={`Inactive (${inactive.length})`}>
              {inactive.map((c) => (
                <CardRow
                  key={c.id}
                  card={c}
                  bank={bankById.get(c.bankId)}
                  onEdit={() => onEdit(c.id)}
                  onToggleActive={() => onToggleActive(c.id)}
                  onDelete={() => onDelete(c.id)}
                />
              ))}
            </Section>
          )}
        </>
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
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function CardRow({
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
  return (
    <Card
      className={cn(
        "flex flex-row items-center gap-3 px-4 py-3",
        !card.active && "opacity-50"
      )}
    >
      <Switch
        checked={card.active}
        onCheckedChange={onToggleActive}
        aria-label="toggle active"
        className="data-checked:bg-emerald-500 data-unchecked:bg-rose-500"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{card.name}</span>
          {card.lastFourDigits && (
            <Badge variant="outline" className="text-muted-foreground">
              ****{card.lastFourDigits}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{bank?.name ?? card.bankId}</span>
          {card.statementDate && <span>ตัดรอบ {card.statementDate}</span>}
          {card.dueDate && <span>ครบกำหนด {card.dueDate}</span>}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="เมนู"
              className="text-muted-foreground hover:text-foreground"
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
    </Card>
  );
}

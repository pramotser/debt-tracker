"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { Bank } from "./types";

// chip สีของแบงก์ — ตัวย่อบนพื้น brandBg/brandFg
// อนาคต upgrade เป็น <img src={bank.logoUrl}/> ที่นี่ที่เดียว
function BankChip({ bank, size = "md" }: { bank: Bank; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-semibold whitespace-nowrap",
        size === "sm"
          ? "h-6 min-w-10 px-1.5 text-[11px]"
          : "h-7 min-w-12 px-2 text-xs"
      )}
      style={{ backgroundColor: bank.brandBg, color: bank.brandFg }}
    >
      {bank.shortName}
    </span>
  );
}

export function BankPicker({
  banks,
  value,
  onChange,
  id,
  placeholder = "เลือกธนาคาร",
}: {
  banks: Bank[];
  value: string;
  onChange: (id: string) => void;
  id?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => banks.find((b) => b.id === value),
    [banks, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter(
      (b) =>
        b.shortName.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q)
    );
  }, [banks, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className="h-10 w-full justify-between gap-2 px-2.5 font-normal"
          >
            <span className="flex min-w-0 items-center gap-2">
              {selected ? (
                <>
                  <BankChip bank={selected} />
                  <span className="truncate text-sm">{selected.name}</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {placeholder}
                </span>
              )}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </Button>
        }
      />
      <PopoverContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))] p-0"
      >
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา ชื่อ หรือตัวย่อ"
              className="h-9 pl-8"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              ไม่พบธนาคาร
            </div>
          ) : (
            filtered.map((b) => {
              const isSelected = b.id === value;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onChange(b.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <BankChip bank={b} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {b.name}
                  </span>
                  {isSelected && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";

import { MonthNav } from "@/components/layout/month-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type Category, LEDGER_ENTRY_TYPES, type LedgerEntryType } from "@/db/schema";
import { shiftMonth } from "@/lib/month";
import { cn } from "@/lib/utils";

import { LEDGER_TYPE_META, type PaidFilter } from "./types";

export type LedgerFiltersState = {
  year: number;
  month: number | null; // null = ทั้งปี
  types: LedgerEntryType[]; // [] = ทั้งหมด
  categoryIds: string[]; // [] = ทั้งหมด
  paid: PaidFilter;
  q: string;
};

export function LedgerFilters({
  state,
  categories,
}: {
  state: LedgerFiltersState;
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [qLocal, setQLocal] = useState(state.q);
  useEffect(() => {
    setQLocal(state.q);
  }, [state.q]);

  // debounce search
  useEffect(() => {
    if (qLocal === state.q) return;
    const id = setTimeout(() => {
      pushParams({ q: qLocal || null });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qLocal]);

  function pushParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  function setMonth(month: number | null) {
    if (month === null) pushParams({ m: "all" });
    else pushParams({ m: String(month) });
  }
  function setYear(year: number) {
    pushParams({ y: String(year) });
  }
  function setTypes(types: LedgerEntryType[]) {
    pushParams({ types: types.length === 0 ? null : types.join(",") });
  }
  function setCategoryIds(ids: string[]) {
    pushParams({ cats: ids.length === 0 ? null : ids.join(",") });
  }
  function setPaid(paid: PaidFilter) {
    pushParams({ paid: paid === "all" ? null : paid });
  }
  function clearAll() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  function shift(delta: number) {
    if (state.month === null) {
      setYear(state.year + delta);
      return;
    }
    const next = shiftMonth({ year: state.year, month: state.month }, delta);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("y", String(next.year));
    sp.set("m", String(next.month));
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`);
    });
  }

  const activeCount =
    (state.types.length > 0 ? 1 : 0) +
    (state.categoryIds.length > 0 ? 1 : 0) +
    (state.paid !== "all" ? 1 : 0) +
    (state.q ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={qLocal}
          onChange={(e) => setQLocal(e.target.value)}
          placeholder="ค้นหาชื่อรายการ..."
          className="pl-9 pr-9"
          aria-label="ค้นหา"
        />
        {qLocal && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setQLocal("")}
            aria-label="ล้างค้นหา"
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-muted-foreground"
          >
            <X />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MonthNav
          year={state.year}
          month={state.month}
          onPrev={() => shift(-1)}
          onNext={() => shift(1)}
        />

        <Button
          type="button"
          variant={state.month === null ? "default" : "outline"}
          size="sm"
          onClick={() => setMonth(state.month === null ? new Date().getMonth() + 1 : null)}
        >
          {state.month === null ? "ดูรายเดือน" : "ทั้งปี"}
        </Button>

        <TypeMultiPopover value={state.types} onChange={setTypes} />
        <CategoryMultiPopover
          categories={categories}
          value={state.categoryIds}
          onChange={setCategoryIds}
        />
        <PaidPopover value={state.paid} onChange={setPaid} />

        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground"
          >
            <X /> ล้างตัวกรอง
          </Button>
        )}

        {pending && (
          <span className="text-xs text-muted-foreground">กำลังโหลด...</span>
        )}
      </div>
    </div>
  );
}

function TypeMultiPopover({
  value,
  onChange,
}: {
  value: LedgerEntryType[];
  onChange: (next: LedgerEntryType[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const isAll = value.length === 0;
  const label = isAll ? "ประเภท: ทั้งหมด" : `ประเภท (${value.length})`;
  function toggle(t: LedgerEntryType) {
    const set = new Set(value);
    if (set.has(t)) set.delete(t);
    else set.add(t);
    onChange(Array.from(set));
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant={isAll ? "outline" : "default"}
            size="sm"
            className="gap-1"
          >
            {label} <ChevronDown className="size-3.5" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-56 p-2">
        <div className="flex flex-col gap-1">
          {LEDGER_ENTRY_TYPES.map((t) => {
            const meta = LEDGER_TYPE_META[t];
            const checked = value.includes(t);
            return (
              <label
                key={t}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/60"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(t)}
                />
                <Badge variant="outline" className={meta.badgeClass}>
                  {meta.label}
                </Badge>
              </label>
            );
          })}
          {value.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="mt-1 text-muted-foreground"
            >
              ล้าง
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CategoryMultiPopover({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const isAll = value.length === 0;
  const label = isAll ? "หมวด: ทั้งหมด" : `หมวด (${value.length})`;
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(needle));
  }, [categories, q]);

  function toggle(id: string) {
    const set = new Set(value);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange(Array.from(set));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant={isAll ? "outline" : "default"}
            size="sm"
            className="gap-1"
          >
            {label} <ChevronDown className="size-3.5" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64 p-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาหมวด..."
          className="mb-2 h-8"
        />
        <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              ไม่พบหมวดหมู่
            </p>
          ) : (
            filtered.map((c) => {
              const checked = value.includes(c.id);
              return (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/60"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(c.id)}
                  />
                  <span
                    className="inline-block size-3 rounded-sm"
                    style={{
                      backgroundColor: c.colorBg ?? "var(--muted)",
                    }}
                    aria-hidden
                  />
                  <span className="truncate">{c.name}</span>
                </label>
              );
            })
          )}
        </div>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
            className="mt-2 w-full text-muted-foreground"
          >
            ล้าง
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function PaidPopover({
  value,
  onChange,
}: {
  value: PaidFilter;
  onChange: (next: PaidFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const labelMap: Record<PaidFilter, string> = {
    all: "สถานะ: ทั้งหมด",
    paid: "สถานะ: จ่ายแล้ว",
    due: "สถานะ: ค้างจ่าย",
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant={value === "all" ? "outline" : "default"}
            size="sm"
            className="gap-1"
          >
            {labelMap[value]} <ChevronDown className="size-3.5" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-44 p-1">
        <RadioRow
          label="ทั้งหมด"
          active={value === "all"}
          onSelect={() => {
            onChange("all");
            setOpen(false);
          }}
        />
        <RadioRow
          label="จ่ายแล้ว"
          active={value === "paid"}
          onSelect={() => {
            onChange("paid");
            setOpen(false);
          }}
        />
        <RadioRow
          label="ค้างจ่าย"
          active={value === "due"}
          onSelect={() => {
            onChange("due");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function RadioRow({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/60",
        active && "bg-secondary font-medium"
      )}
    >
      <span
        className={cn(
          "inline-block size-2 rounded-full",
          active ? "bg-foreground" : "bg-muted-foreground/40"
        )}
      />
      {label}
    </button>
  );
}


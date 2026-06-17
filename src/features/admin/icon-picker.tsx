"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  CATEGORY_ICON_OPTIONS,
  getCategoryIcon,
  type CategoryIconOption,
} from "@/lib/categories";

export function IconPicker({
  value,
  onChange,
  bgPreview,
  fgPreview,
}: {
  value: string;
  onChange: (key: string) => void;
  bgPreview?: string;
  fgPreview?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const SelectedIcon = getCategoryIcon(value || null);
  const selectedLabel =
    CATEGORY_ICON_OPTIONS.find((o) => o.key === value)?.label ?? value;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORY_ICON_OPTIONS;
    return CATEGORY_ICON_OPTIONS.filter(
      (o) =>
        o.key.toLowerCase().includes(q) ||
        o.label.toLowerCase().includes(q) ||
        o.group.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const m = new Map<string, CategoryIconOption[]>();
    for (const o of filtered) {
      const arr = m.get(o.group) ?? [];
      arr.push(o);
      m.set(o.group, arr);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const previewBg = bgPreview ?? "transparent";
  const previewFg = fgPreview ?? "currentColor";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            type="button"
            className="w-full justify-between gap-2 font-normal"
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-flex size-7 items-center justify-center rounded-md"
                style={{
                  backgroundColor: previewBg,
                  color: previewFg,
                }}
                aria-hidden
              >
                <SelectedIcon className="size-4" />
              </span>
              <span className="text-sm">
                {selectedLabel || "เลือกไอคอน"}
              </span>
            </span>
            <ChevronDown className="size-4 opacity-60" />
          </Button>
        }
      />
      <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-0" align="start">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาไอคอน"
              className="h-9 pl-8"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {grouped.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              ไม่พบไอคอน
            </div>
          ) : (
            grouped.map(([group, opts]) => (
              <div key={group} className="mb-3 last:mb-0">
                <div className="px-1 pb-1 text-xs font-medium text-muted-foreground">
                  {group}
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {opts.map((o) => {
                    const selected = value === o.key;
                    const Icon = o.Icon;
                    return (
                      <button
                        key={o.key}
                        type="button"
                        title={o.label}
                        aria-label={o.label}
                        onClick={() => {
                          onChange(o.key);
                          setOpen(false);
                          setQuery("");
                        }}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-md border text-foreground/70 transition-colors",
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-transparent hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="size-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

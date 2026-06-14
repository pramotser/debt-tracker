"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import type { Category } from "@/db/schema";
import { getCategoryIcon } from "@/lib/categories";
import { cn } from "@/lib/utils";

// Picker เลือก category สไตล์ KBank
// default = แถวเลื่อนแนวนอน (เห็น ~4 ตัวบน mobile, free scroll, snap)
// กด "ดูทั้งหมด" → flip เป็น grid เต็ม · selection sync กัน
// auto-scroll ให้เห็นตัวที่ active เสมอตอนเปิด/เปลี่ยน value
export function CategoryPickerGrid({
  categories,
  value,
  onChange,
  ariaLabel = "หมวดหมู่",
  className,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const activeRowItemRef = useRef<HTMLButtonElement>(null);

  // sync scroll → ให้เห็นตัวที่ active เสมอ ตอนเปิดมาหรือ value เปลี่ยนจากข้างนอก
  // เฉพาะตอนอยู่ row view (expanded grid ไม่ต้อง — เห็นทุกตัวอยู่แล้ว)
  useEffect(() => {
    if (expanded) return;
    const item = activeRowItemRef.current;
    if (!item) return;
    item.scrollIntoView({ block: "nearest", inline: "center" });
  }, [value, expanded]);

  // min-w-0 = ปล่อยให้ flex parent หดได้ (กัน content ดัน width)
  // ส่วน scroll container จริงๆ ที่ sever min-content propagation อยู่ที่ wrapper รอบ form
  // ใน dialog (pattern เดียวกับ plan-dialog: <div className="max-h-[70vh] overflow-y-auto">)
  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="flex items-center justify-between gap-2 pb-2">
        <span className="truncate text-xs text-muted-foreground">
          {expanded ? "เลือกหมวด" : "เลือกหมวด · ปัดเพื่อดูเพิ่ม"}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="shrink-0 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {expanded ? "ย่อ" : "ดูทั้งหมด"}
        </button>
      </div>

      {expanded ? (
        <div
          role="radiogroup"
          aria-label={ariaLabel}
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
        >
          {categories.map((c) => (
            <CategoryOption
              key={c.id}
              category={c}
              active={c.id === value}
              variant="grid"
              onSelect={() => onChange(c.id)}
            />
          ))}
        </div>
      ) : (
        <div
          ref={rowRef}
          role="radiogroup"
          aria-label={ariaLabel}
          className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 py-3 scroll-px-4"
        >
          {categories.map((c) => {
            const active = c.id === value;
            return (
              <CategoryOption
                key={c.id}
                ref={active ? activeRowItemRef : undefined}
                category={c}
                active={active}
                variant="row"
                onSelect={() => onChange(c.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ปุ่ม category ตัวเดียว · variant=row → fixed-width snap card / variant=grid → cell ใน grid
const CategoryOption = function CategoryOption({
  category,
  active,
  variant,
  onSelect,
  ref,
}: {
  category: Category;
  active: boolean;
  variant: "row" | "grid";
  onSelect: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const Icon = getCategoryIcon(category.icon);
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 rounded-[14px] p-2 text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "row" && "w-[4.5rem] shrink-0 snap-start sm:w-20",
        active
          ? "bg-muted shadow-[0_3px_14px_rgba(0,0,0,0.13)]"
          : "bg-transparent hover:bg-muted/40"
      )}
    >
      <span className="relative">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            active ? "scale-110 shadow-[0_4px_14px_rgba(0,0,0,0.18)]" : ""
          )}
          style={{ backgroundColor: category.colorBg, color: category.colorFg }}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <span
          className={cn(
            "absolute -right-[3px] -top-[3px] flex h-4 w-4 items-center justify-center rounded-full bg-[#1e293b] transition-all duration-200",
            active ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
          aria-hidden
        >
          <Check className="h-[10px] w-[10px] text-white" strokeWidth={3} />
        </span>
      </span>
      <span className="line-clamp-2 text-center text-[11px] leading-tight">
        {category.name}
      </span>
    </button>
  );
};

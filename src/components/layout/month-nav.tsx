"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatYearMonth } from "@/lib/format";

// pill กล่องเดียวสำหรับ < YYYY/MM > — ใช้ทุกที่ที่มีการเปลี่ยนเดือน
// month=null → "YYYY (ทั้งปี)" สำหรับโหมด year-only (ledger)
export function MonthNav({
  year,
  month,
  onPrev,
  onNext,
  disabled,
}: {
  year: number;
  month: number | null;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
}) {
  const label =
    month === null ? `${year} (ทั้งปี)` : formatYearMonth(year, month);
  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-background">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        disabled={disabled}
        aria-label="ก่อนหน้า"
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-[6.5rem] text-center text-sm font-medium tabular-nums">
        {label}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={disabled}
        aria-label="ถัดไป"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

// shape เดียวกันสำหรับ loading state — label เป็น Skeleton
export function MonthNavSkeleton() {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-background">
      <Button variant="ghost" size="icon" disabled aria-label="ก่อนหน้า">
        <ChevronLeft />
      </Button>
      <span className="flex min-w-[6.5rem] items-center justify-center px-1">
        <Skeleton className="h-4 w-16" />
      </span>
      <Button variant="ghost" size="icon" disabled aria-label="ถัดไป">
        <ChevronRight />
      </Button>
    </div>
  );
}

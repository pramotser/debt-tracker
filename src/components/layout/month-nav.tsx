"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatYearMonth } from "@/lib/format";

export function MonthNav({
  year,
  month,
  onPrev,
  onNext,
  disabled,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        disabled={disabled}
        aria-label="เดือนก่อน"
      >
        <ChevronLeft />
      </Button>
      <span className="text-xl font-bold tabular-nums">
        {formatYearMonth(year, month)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={disabled}
        aria-label="เดือนถัดไป"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

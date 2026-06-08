"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { formatYearMonth } from "@/lib/format";
import type { YearMonth } from "./types";

function shiftMonth(ym: YearMonth, delta: number): YearMonth {
  let m = ym.month + delta;
  let y = ym.year;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return { year: y, month: m };
}

export function MonthNav({ ym }: { ym: YearMonth }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (delta: number) => {
    const next = shiftMonth(ym, delta);
    startTransition(() => {
      router.push(`?y=${next.year}&m=${next.month}`, { scroll: false });
    });
  };

  return (
    <div className="flex items-center gap-2" data-pending={pending}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => go(-1)}
        aria-label="เดือนก่อน"
      >
        <ChevronLeft />
      </Button>
      <span className="text-xl font-bold tabular-nums">
        {formatYearMonth(ym.year, ym.month)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => go(1)}
        aria-label="เดือนถัดไป"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

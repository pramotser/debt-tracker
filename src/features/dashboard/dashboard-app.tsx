"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  fetchDashboardDataByMonth,
  type DashboardMonthData,
} from "@/server/actions/dashboard";
import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";
import { MonthNav } from "@/components/layout/month-nav";
import { shiftMonth, ymKey } from "@/lib/month";

import { InstallmentRunway } from "./installment-runway";
import { KpiCards } from "./kpi-cards";
import { TrendChart } from "./trend-chart";
import { TypeBreakdownChart } from "./type-breakdown-chart";
import type { YearMonth } from "./types";

// best-effort idle scheduler (Safari ไม่มี requestIdleCallback)
function scheduleIdle(fn: () => void): void {
  type W = Window & {
    requestIdleCallback?: (cb: () => void) => number;
  };
  const w = window as W;
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(fn);
  } else {
    setTimeout(fn, 200);
  }
}

export function DashboardApp({
  initialYm,
  initialData,
  plans,
}: {
  initialYm: YearMonth;
  initialData: DashboardMonthData;
  plans: InstallmentPlanWithProgress[];
}) {
  const router = useRouter();
  const [ym, setYm] = useState<YearMonth>(initialYm);
  const [data, setData] = useState<DashboardMonthData>(initialData);
  const [pending, startMonthChange] = useTransition();

  const cacheRef = useRef<Map<string, DashboardMonthData>>(
    new Map([[ymKey(initialYm.year, initialYm.month), initialData]])
  );

  // ymRef = ค่าล่าสุดเสมอ ใช้เช็คใน async ว่ายังอยู่เดือนเดียวกันมั้ย
  const ymRef = useRef(ym);
  useEffect(() => {
    ymRef.current = ym;
  }, [ym]);

  const navigateMonth = (delta: number) => {
    const next = shiftMonth(ym, delta);
    const key = ymKey(next.year, next.month);
    const cached = cacheRef.current.get(key);

    setYm(next);
    router.replace(`?y=${next.year}&m=${next.month}`, { scroll: false });

    if (cached) {
      setData(cached);
      return;
    }

    startMonthChange(async () => {
      try {
        const fetched = await fetchDashboardDataByMonth(next.year, next.month);
        cacheRef.current.set(key, fetched);
        if (
          ymRef.current.year === next.year &&
          ymRef.current.month === next.month
        ) {
          setData(fetched);
        }
      } catch (err) {
        toast.error("โหลดเดือนไม่สำเร็จ");
        console.error("fetchDashboardDataByMonth failed", err);
      }
    });
  };

  // prefetch prev/next month ตอน idle
  useEffect(() => {
    const targets = [shiftMonth(ym, -1), shiftMonth(ym, 1)];
    let cancelled = false;
    scheduleIdle(() => {
      if (cancelled) return;
      for (const t of targets) {
        const key = ymKey(t.year, t.month);
        if (cacheRef.current.has(key)) continue;
        fetchDashboardDataByMonth(t.year, t.month)
          .then((d) => {
            if (cancelled) return;
            cacheRef.current.set(key, d);
          })
          .catch(() => {
            // prefetch fail เงียบๆ — ค่อย fetch จริงตอนนาวิเกตเอง
          });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ym]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ภาพรวม</h1>
        <MonthNav
          year={ym.year}
          month={ym.month}
          onPrev={() => navigateMonth(-1)}
          onNext={() => navigateMonth(1)}
        />
      </div>

      <div
        className={
          pending
            ? "flex flex-col gap-5 opacity-60 transition-opacity"
            : "flex flex-col gap-5 transition-opacity"
        }
        aria-busy={pending}
      >
        <KpiCards kpis={data.kpis} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TrendChart data={data.trend} />
          </div>
          <TypeBreakdownChart data={data.breakdown} />
        </div>
      </div>

      <InstallmentRunway plans={plans} />
    </div>
  );
}

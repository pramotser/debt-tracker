"use client";

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

export function DashboardApp({
  initialYm,
  initialData,
  plans,
}: {
  initialYm: YearMonth;
  initialData: DashboardMonthData;
  plans: InstallmentPlanWithProgress[];
}) {
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
    window.history.replaceState(null, "", `?y=${next.year}&m=${next.month}`);

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

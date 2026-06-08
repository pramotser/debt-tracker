import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";
import type {
  DashboardKpis,
  MonthlyTrendPoint,
  TypeBreakdownItem,
} from "@/server/queries/dashboard";

import { InstallmentRunway } from "./installment-runway";
import { KpiCards } from "./kpi-cards";
import { MonthNav } from "./month-nav";
import { TrendChart } from "./trend-chart";
import { TypeBreakdownChart } from "./type-breakdown-chart";
import type { YearMonth } from "./types";

export function DashboardApp({
  ym,
  kpis,
  trend,
  breakdown,
  plans,
}: {
  ym: YearMonth;
  kpis: DashboardKpis;
  trend: MonthlyTrendPoint[];
  breakdown: TypeBreakdownItem[];
  plans: InstallmentPlanWithProgress[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ภาพรวม</h1>
        <MonthNav ym={ym} />
      </div>

      <KpiCards kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart data={trend} />
        </div>
        <TypeBreakdownChart data={breakdown} />
      </div>

      <InstallmentRunway plans={plans} />
    </div>
  );
}

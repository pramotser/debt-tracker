"use client";

import { CategoryFlowList } from "./category-flow-list";
import { InstallmentProgress } from "./installment-progress";
import { MonthlyHeatmap } from "./monthly-heatmap";
import { MonthlyTrendChart } from "./monthly-trend-chart";
import { TypeBreakdownDonut } from "./type-breakdown-donut";
import type { DashboardV2Data } from "./types";

export function OverviewTab({ data }: { data: DashboardV2Data }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <MonthlyTrendChart data={data.trailing} />
      <TypeBreakdownDonut data={data.typeBreakdown} />
      <CategoryFlowList data={data.categoryFlow} />
      <InstallmentProgress data={data.installments} />
      <div className="lg:col-span-2">
        <MonthlyHeatmap data={data.heatmap} initialYear={data.year} />
      </div>
    </div>
  );
}

"use client";

import { CategoryFlowList } from "./category-flow-list";
import { InstallmentProgress } from "./installment-progress";
import { MonthlyHeatmap } from "./monthly-heatmap";
import { MonthlyTrendChart } from "./monthly-trend-chart";
import { TypeBreakdownDonut } from "./type-breakdown-donut";
import { UpcomingChart } from "./upcoming-chart";
import type { DashboardData } from "./types";

export function OverviewTab({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <MonthlyTrendChart data={data.trailing} />
      <UpcomingChart data={data.upcoming} />
      <TypeBreakdownDonut data={data.typeBreakdown} />
      <CategoryFlowList data={data.categoryFlow} />
      <div className="md:col-span-2">
        <InstallmentProgress data={data.installments} />
      </div>
      <div className="md:col-span-2">
        <MonthlyHeatmap data={data.heatmap} initialYear={data.year} />
      </div>
    </div>
  );
}

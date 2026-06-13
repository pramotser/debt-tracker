"use client";

import { CategoryFlowList } from "./category-flow-list";
import { InstallmentProgress } from "./installment-progress";
import { MonthlyHeatmap } from "./monthly-heatmap";
import { TypeBreakdownDonut } from "./type-breakdown-donut";
import { UpcomingChart } from "./upcoming-chart";
import type { DashboardData } from "./types";

export function OverviewTab({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UpcomingChart data={data.upcoming} />
      <TypeBreakdownDonut data={data.typeBreakdown} />
      <CategoryFlowList data={data.categoryFlow} />
      <InstallmentProgress data={data.installments} />
      <div className="md:col-span-2">
        <MonthlyHeatmap data={data.heatmap} initialYear={data.year} />
      </div>
    </div>
  );
}

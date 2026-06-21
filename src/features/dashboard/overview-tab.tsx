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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
      {/* แถว 1: แนวโน้มย้อนหลัง | ข้างหน้า */}
      <MonthlyTrendChart data={data.trailing} />
      <UpcomingChart data={data.upcoming} />
      {/* แถว 2: รายจ่ายตามประเภท | ความหนาแน่นภาระรายเดือน */}
      <TypeBreakdownDonut data={data.typeBreakdown} />
      <MonthlyHeatmap data={data.heatmap} initialYear={data.year} />
      {/* แถว 3: เงินไหลไปหมวดไหน | ความคืบหน้าแผนผ่อน */}
      <CategoryFlowList data={data.categoryFlow} scroll />
      <InstallmentProgress data={data.installments} />
    </div>
  );
}

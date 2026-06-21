import { DashboardTabs } from "@/features/dashboard/dashboard-tabs";
import type { DashboardData } from "@/features/dashboard/types";
import {
  getCategoryFlow,
  getCategoryFlowByMonth,
  getHeatmapByYears,
  getInstallmentProgress,
  getThisMonthSummary,
  getTrailingTotals,
  getTypeBreakdown,
  getTypeBreakdownByMonth,
  getUpcomingTotals,
} from "@/server/queries/dashboard";

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [
    summary,
    trailing,
    upcoming,
    typeBreakdown,
    typeBreakdownThisMonth,
    categoryFlow,
    categoryFlowThisMonth,
    installments,
    heatmap,
  ] = await Promise.all([
    getThisMonthSummary(year, month),
    getTrailingTotals(year, month, 6),
    getUpcomingTotals(year, month, 6),
    getTypeBreakdown(),
    getTypeBreakdownByMonth(year, month),
    getCategoryFlow(),
    getCategoryFlowByMonth(year, month),
    getInstallmentProgress(),
    getHeatmapByYears(year),
  ]);

  const data: DashboardData = {
    year,
    month,
    summary,
    trailing,
    upcoming,
    typeBreakdown,
    typeBreakdownThisMonth,
    categoryFlow,
    categoryFlowThisMonth,
    installments,
    heatmap,
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <DashboardTabs data={data} />
    </div>
  );
}

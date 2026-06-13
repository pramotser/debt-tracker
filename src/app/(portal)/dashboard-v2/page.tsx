import { DashboardTabs } from "@/features/dashboard-v2/dashboard-tabs";
import type { DashboardV2Data } from "@/features/dashboard-v2/types";
import {
  getAvailableLedgerYears,
  getCategoryFlow,
  getInstallmentProgress,
  getMonthlyHeatmap,
  getThisMonthSummary,
  getTrailingTotals,
  getTypeBreakdown,
  getUpcomingTotals,
} from "@/server/queries/dashboard-v2";

export default async function DashboardV2Page() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [
    summary,
    trailing,
    upcoming,
    typeBreakdown,
    categoryFlow,
    installments,
    heatmap,
    availableYears,
  ] = await Promise.all([
    getThisMonthSummary(year, month),
    getTrailingTotals(year, month, 6),
    getUpcomingTotals(year, month, 6),
    getTypeBreakdown(),
    getCategoryFlow(),
    getInstallmentProgress(),
    getMonthlyHeatmap(year),
    getAvailableLedgerYears(),
  ]);

  const data: DashboardV2Data = {
    year,
    month,
    summary,
    trailing,
    upcoming,
    typeBreakdown,
    categoryFlow,
    installments,
    heatmap,
    heatmapYear: year,
    availableYears,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Dashboard V2</h1>
        <p className="text-sm text-muted-foreground">
          พรีวิวก่อนโยกแทน /dashboard เดิม
        </p>
      </div>
      <DashboardTabs data={data} />
    </div>
  );
}

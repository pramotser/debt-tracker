import type {
  CategoryFlowItem,
  HeatmapByYear,
  InstallmentProgressItem,
  MonthTotal,
  ThisMonthSummary,
  TypeBreakdownItem,
} from "@/server/queries/dashboard";

export type DashboardData = {
  year: number;
  month: number;
  summary: ThisMonthSummary;
  trailing: MonthTotal[];
  upcoming: MonthTotal[];
  typeBreakdown: TypeBreakdownItem[];
  typeBreakdownThisMonth: TypeBreakdownItem[];
  categoryFlow: CategoryFlowItem[];
  installments: InstallmentProgressItem[];
  heatmap: HeatmapByYear;
};

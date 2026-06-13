import type {
  CategoryFlowItem,
  HeatmapCell,
  InstallmentProgressItem,
  MonthTotal,
  ThisMonthSummary,
  TypeBreakdownItem,
} from "@/server/queries/dashboard-v2";

export type DashboardV2Data = {
  year: number;
  month: number;
  summary: ThisMonthSummary;
  trailing: MonthTotal[];
  upcoming: MonthTotal[];
  typeBreakdown: TypeBreakdownItem[];
  categoryFlow: CategoryFlowItem[];
  installments: InstallmentProgressItem[];
  heatmap: HeatmapCell[];
  heatmapYear: number;
  availableYears: number[];
};

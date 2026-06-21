import type {
  CategoryFlowItem,
  HeatmapByYear,
  InstallmentProgressItem,
  MonthTotal,
  ThisMonthSummary,
  TimelineItem,
  TypeBreakdownItem,
} from "@/server/queries/dashboard";

export type DashboardData = {
  year: number;
  month: number;
  todayDay: number; // วันที่ของวันนี้ (server) — ใช้คำนวณ "อีก N วัน" / "เลยกำหนด"
  summary: ThisMonthSummary;
  trailing: MonthTotal[];
  upcoming: MonthTotal[];
  timeline: TimelineItem[];
  typeBreakdown: TypeBreakdownItem[];
  typeBreakdownThisMonth: TypeBreakdownItem[];
  categoryFlow: CategoryFlowItem[];
  installments: InstallmentProgressItem[];
  heatmap: HeatmapByYear;
};

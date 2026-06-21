import type {
  CategoryFlowItem,
  HeatmapByYear,
  InstallmentProgressItem,
  MonthTotal,
  ThisMonthSummary,
  TypeBreakdownItem,
} from "@/server/queries/dashboard";

// หมายเหตุ: timeline (getThisMonthTimeline + this-month-timeline.tsx) ถูกซ่อนไว้ก่อน
// รอ logic รอบบัตรเครดิต (วันตัด/วันครบกำหนด) — re-enable แล้วค่อยเพิ่ม timeline/todayDay กลับ
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

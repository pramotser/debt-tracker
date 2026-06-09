"use server";

import { z } from "zod";

import {
  getDashboardKpis,
  getMonthlyTrend,
  getTypeBreakdown,
  type DashboardKpis,
  type MonthlyTrendPoint,
  type TypeBreakdownItem,
} from "@/server/queries/dashboard";

const yearSchema = z.number().int().min(1970).max(9999);
const monthSchema = z.number().int().min(1).max(12);

export type DashboardMonthData = {
  kpis: DashboardKpis;
  trend: MonthlyTrendPoint[];
  breakdown: TypeBreakdownItem[];
};

// client เรียกตอนเปลี่ยนเดือน — ไม่ revalidate (client เก็บ cache เอง)
// บันเดิล 3 query ของเดือนเดียวกันให้ออกพร้อมกัน (Promise.all ฝั่ง server)
export async function fetchDashboardDataByMonth(
  year: number,
  month: number
): Promise<DashboardMonthData> {
  const y = yearSchema.parse(year);
  const m = monthSchema.parse(month);
  const [kpis, trend, breakdown] = await Promise.all([
    getDashboardKpis(y, m),
    getMonthlyTrend(y, m, 6),
    getTypeBreakdown(y, m),
  ]);
  return { kpis, trend, breakdown };
}

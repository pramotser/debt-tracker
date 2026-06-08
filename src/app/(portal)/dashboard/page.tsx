import { DashboardApp } from "@/features/dashboard/dashboard-app";
import { listInstallmentPlans } from "@/server/queries/credit-card-installments";
import {
  getDashboardKpis,
  getMonthlyTrend,
  getTypeBreakdown,
} from "@/server/queries/dashboard";

function parseYm(searchParams: Record<string, string | string[] | undefined>) {
  const yRaw = Array.isArray(searchParams.y) ? searchParams.y[0] : searchParams.y;
  const mRaw = Array.isArray(searchParams.m) ? searchParams.m[0] : searchParams.m;
  const yParsed = yRaw ? Number(yRaw) : NaN;
  const mParsed = mRaw ? Number(mRaw) : NaN;
  const now = new Date();
  const year =
    Number.isInteger(yParsed) && yParsed >= 1970 && yParsed <= 9999
      ? yParsed
      : now.getFullYear();
  const month =
    Number.isInteger(mParsed) && mParsed >= 1 && mParsed <= 12
      ? mParsed
      : now.getMonth() + 1;
  return { year, month };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ym = parseYm(sp);
  const [kpis, trend, breakdown, plans] = await Promise.all([
    getDashboardKpis(ym.year, ym.month),
    getMonthlyTrend(ym.year, ym.month, 6),
    getTypeBreakdown(ym.year, ym.month),
    listInstallmentPlans(),
  ]);
  return (
    <DashboardApp
      ym={ym}
      kpis={kpis}
      trend={trend}
      breakdown={breakdown}
      plans={plans}
    />
  );
}

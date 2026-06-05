import { FixCostApp } from "@/features/fix-cost/fix-cost-app";
import { listTemplates } from "@/server/queries/fixed-cost-templates";
import { listFixCostEntriesByMonth } from "@/server/queries/ledger-entries";

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

export default async function FixCostPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ym = parseYm(sp);
  const [templates, entries] = await Promise.all([
    listTemplates(),
    listFixCostEntriesByMonth(ym.year, ym.month),
  ]);
  return (
    <FixCostApp
      initialTemplates={templates}
      initialEntries={entries}
      ym={ym}
    />
  );
}

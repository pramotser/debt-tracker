import { RecurringApp } from "@/features/recurring/recurring-app";
import { getCategories } from "@/server/queries/categories";
import { listRecurringEntriesByMonth } from "@/server/queries/ledger-entries";
import { listRecurringTemplates } from "@/server/queries/recurring-templates";

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

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ym = parseYm(sp);
  const [templates, entries, categories] = await Promise.all([
    listRecurringTemplates(),
    listRecurringEntriesByMonth(ym.year, ym.month),
    getCategories(),
  ]);
  return (
    <RecurringApp
      initialTemplates={templates}
      initialEntries={entries}
      categories={categories}
      ym={ym}
    />
  );
}

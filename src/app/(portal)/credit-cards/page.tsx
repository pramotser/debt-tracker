import { CreditCardsApp } from "@/features/credit-cards/credit-cards-app";
import { getCategories } from "@/server/queries/categories";
import {
  listAllInstallmentEntries,
  listInstallmentPlans,
} from "@/server/queries/credit-card-installments";
import { listCreditCardLedgerByMonth } from "@/server/queries/credit-card-charges";
import { listCreditCards } from "@/server/queries/credit-cards";

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

export default async function CreditCardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ym = parseYm(sp);
  const [cards, plans, entries, installmentEntries, categories] = await Promise.all([
    listCreditCards(),
    listInstallmentPlans(),
    listCreditCardLedgerByMonth(ym.year, ym.month),
    listAllInstallmentEntries(),
    getCategories(),
  ]);
  return (
    <CreditCardsApp
      initialCards={cards}
      initialPlans={plans}
      initialEntries={entries}
      initialInstallmentEntries={installmentEntries}
      categories={categories}
      ym={ym}
    />
  );
}

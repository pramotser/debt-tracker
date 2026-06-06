import { InstallmentApp } from "@/features/installment/installment-app";
import {
  listAllInstallmentEntries,
  listInstallmentPlans,
} from "@/server/queries/credit-card-installments";
import { listCreditCards } from "@/server/queries/credit-cards";

export default async function InstallmentPage() {
  const now = new Date();
  const currentYm = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const [cards, plans, entries] = await Promise.all([
    listCreditCards(),
    listInstallmentPlans(),
    listAllInstallmentEntries(),
  ]);
  return (
    <InstallmentApp
      initialCards={cards}
      initialPlans={plans}
      initialEntries={entries}
      currentYm={currentYm}
    />
  );
}

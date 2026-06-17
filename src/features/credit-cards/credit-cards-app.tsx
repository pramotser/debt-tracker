/** Spec: docs/specs/credit-cards/credit-cards.md — orchestrator ของ 3 tabs (state ร่วมอยู่ที่นี่, logic ในแต่ละ tab) */
"use client";

import { useCallback, useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";

import { CardsTab } from "./tabs/cards-tab";
import { InstallmentTab } from "./tabs/installment-tab";
import { StatementTab } from "./tabs/statement-tab";
import type {
  Bank,
  Category,
  CreditCard,
  LedgerEntry,
  YearMonth,
} from "./types";

type TabValue = "statement" | "installment" | "mine";

const tabTriggerClass =
  "-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!";

export function CreditCardsApp({
  initialCards,
  initialPlans,
  initialEntries,
  initialInstallmentEntries,
  categories,
  banks,
  ym: initialYm,
}: {
  initialCards: CreditCard[];
  initialPlans: InstallmentPlanWithProgress[];
  initialEntries: LedgerEntry[];
  initialInstallmentEntries: LedgerEntry[];
  categories: Category[];
  banks: Bank[];
  ym: YearMonth;
}) {
  const [cards, setCards] = useState<CreditCard[]>(initialCards);
  const [plans, setPlans] =
    useState<InstallmentPlanWithProgress[]>(initialPlans);
  const [installmentEntries, setInstallmentEntries] = useState<LedgerEntry[]>(
    initialInstallmentEntries
  );
  const [activeTab, setActiveTab] = useState<TabValue>("statement");
  const [scrollToPlanId, setScrollToPlanId] = useState<string | null>(null);

  // sync state ตอน server ส่ง props ใหม่ (router.refresh จาก settle/delete plan)
  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);
  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);
  useEffect(() => {
    setInstallmentEntries(initialInstallmentEntries);
  }, [initialInstallmentEntries]);

  const jumpToPlan = useCallback((planId: string) => {
    setActiveTab("installment");
    setScrollToPlanId(planId);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">บัตรเครดิต</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0"
        >
          <TabsTrigger value="statement" className={tabTriggerClass}>
            รายการชำระบัตรเครดิต
          </TabsTrigger>
          <TabsTrigger value="installment" className={tabTriggerClass}>
            รายการผ่อนชำระ
          </TabsTrigger>
          <TabsTrigger value="mine" className={tabTriggerClass}>
            บัตรของฉัน
          </TabsTrigger>
        </TabsList>

        {/* keepMounted = เก็บ state ใน tab (เช่น ym/cache ของ statement) ไม่ให้รีเซ็ตตอนสลับ tab */}
        <TabsContent value="statement" className="mt-4" keepMounted>
          <StatementTab
            initialYm={initialYm}
            initialEntries={initialEntries}
            cards={cards}
            plans={plans}
            categories={categories}
            onJumpToPlan={jumpToPlan}
          />
        </TabsContent>

        <TabsContent value="installment" className="mt-4" keepMounted>
          <InstallmentTab
            cards={cards}
            plans={plans}
            setPlans={setPlans}
            entries={installmentEntries}
            setEntries={setInstallmentEntries}
            categories={categories}
            scrollToPlanId={scrollToPlanId}
            onScrolled={() => setScrollToPlanId(null)}
          />
        </TabsContent>

        <TabsContent value="mine" className="mt-4" keepMounted>
          <CardsTab cards={cards} setCards={setCards} banks={banks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

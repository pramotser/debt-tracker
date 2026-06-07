"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createCreditCardCharge,
  deleteCreditCardCharge,
  toggleCreditCardChargePaid,
  updateCreditCardChargeAmount,
} from "@/server/actions/credit-card-charges";
import {
  createInstallmentPlan,
  deleteInstallmentPlan,
  settleInstallmentEarly,
  toggleInstallmentLedgerPaid,
  updateLedgerInterestSplit,
} from "@/server/actions/credit-card-installments";
import {
  createCreditCard,
  deleteCreditCard,
  toggleCreditCardActive,
  updateCreditCard,
} from "@/server/actions/credit-cards";
import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";

import { CardDialog, type CardDraft } from "./card-dialog";
import { CardListView } from "./card-list-view";
import { ChargeDialog, type ChargeDraft } from "./charge-dialog";
import { InstallmentView } from "./installment-view";
import { MOCK_BANKS, MOCK_CATEGORIES } from "./mock";
import { PlanDialog, type PlanDraft } from "./plan-dialog";
import { SettleDialog, type SettleDraft } from "./settle-dialog";
import { StatementView } from "./statement-view";
import type { CreditCard, LedgerEntry, YearMonth } from "./types";

function shiftMonth(ym: YearMonth, delta: number): YearMonth {
  let m = ym.month + delta;
  let y = ym.year;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return { year: y, month: m };
}

export function CreditCardsApp({
  initialCards,
  initialPlans,
  initialEntries,
  initialInstallmentEntries,
  ym,
}: {
  initialCards: CreditCard[];
  initialPlans: InstallmentPlanWithProgress[];
  initialEntries: LedgerEntry[];
  initialInstallmentEntries: LedgerEntry[];
  ym: YearMonth;
}) {
  const router = useRouter();
  const [cards, setCards] = useState<CreditCard[]>(initialCards);
  const [plans, setPlans] =
    useState<InstallmentPlanWithProgress[]>(initialPlans);
  const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
  const [installmentEntries, setInstallmentEntries] = useState<LedgerEntry[]>(
    initialInstallmentEntries
  );
  const [, startMutation] = useTransition();

  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);
  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);
  useEffect(() => {
    setInstallmentEntries(initialInstallmentEntries);
  }, [initialInstallmentEntries]);

  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [settlingPlan, setSettlingPlan] =
    useState<InstallmentPlanWithProgress | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const navigateMonth = (delta: number) => {
    const next = shiftMonth(ym, delta);
    router.push(`?y=${next.year}&m=${next.month}`);
  };

  // === card mutations ===
  const handleSubmitCard = (d: CardDraft) => {
    if (editingCard) {
      const id = editingCard.id;
      const prev = editingCard;
      setCards((p) =>
        p.map((c) =>
          c.id === id
            ? {
                ...c,
                name: d.name,
                bankId: d.bankId,
                lastFourDigits: d.lastFourDigits,
                statementDate: d.statementDate,
                dueDate: d.dueDate,
                updatedAt: new Date(),
              }
            : c
        )
      );
      setEditingCard(null);
      startMutation(async () => {
        try {
          const row = await updateCreditCard(id, d);
          setCards((p) => p.map((c) => (c.id === id ? row : c)));
        } catch (err) {
          toast.error("บันทึกบัตรไม่สำเร็จ");
          console.error("updateCreditCard failed", err);
          setCards((p) => p.map((c) => (c.id === id ? prev : c)));
        }
      });
      return;
    }
    startMutation(async () => {
      try {
        const row = await createCreditCard(d);
        setCards((p) => [...p, row]);
      } catch (err) {
        toast.error("เพิ่มบัตรไม่สำเร็จ");
        console.error("createCreditCard failed", err);
      }
    });
  };

  const handleToggleCardActive = (id: string) => {
    const target = cards.find((c) => c.id === id);
    if (!target) return;
    const next = !target.active;
    setCards((p) => p.map((c) => (c.id === id ? { ...c, active: next } : c)));
    startMutation(async () => {
      try {
        await toggleCreditCardActive(id, next);
      } catch (err) {
        toast.error("เปลี่ยนสถานะไม่สำเร็จ");
        console.error("toggleCreditCardActive failed", err);
        setCards((p) => p.map((c) => (c.id === id ? { ...c, active: !next } : c)));
      }
    });
  };

  const confirmDeleteCard = () => {
    if (!deletingCardId) return;
    const id = deletingCardId;
    setDeletingCardId(null);
    const prev = cards.find((c) => c.id === id);
    setCards((p) => p.filter((c) => c.id !== id));
    startMutation(async () => {
      try {
        await deleteCreditCard(id);
      } catch (err) {
        toast.error("ลบบัตรไม่สำเร็จ — อาจมีแผนผ่อนผูกอยู่");
        console.error("deleteCreditCard failed", err);
        if (prev) setCards((p) => [...p, prev]);
      }
    });
  };

  // === charge mutations ===
  const handleSubmitCharge = (d: ChargeDraft) => {
    startMutation(async () => {
      try {
        const row = await createCreditCardCharge(d);
        setEntries((p) => [...p, row]);
      } catch (err) {
        toast.error("เพิ่มรายการไม่สำเร็จ");
        console.error("createCreditCardCharge failed", err);
      }
    });
  };

  const handleTogglePaidCharge = (entry: LedgerEntry) => {
    const next = !entry.paid;
    setEntries((p) =>
      p.map((e) =>
        e.id === entry.id
          ? { ...e, paid: next, paidAt: next ? new Date() : null }
          : e
      )
    );
    startMutation(async () => {
      try {
        if (entry.type === "CREDIT_CARD") {
          await toggleCreditCardChargePaid(entry.id, next);
        } else {
          await toggleInstallmentLedgerPaid(entry.id, next);
        }
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("togglePaid failed", err);
        setEntries((p) =>
          p.map((e) =>
            e.id === entry.id
              ? { ...e, paid: !next, paidAt: !next ? new Date() : null }
              : e
          )
        );
      }
    });
  };

  const handleUpdateAmount = (entry: LedgerEntry, amount: string) => {
    if (entry.type !== "CREDIT_CARD") return;
    const prev = entry;
    setEntries((p) =>
      p.map((e) => (e.id === entry.id ? { ...e, amount } : e))
    );
    startMutation(async () => {
      try {
        await updateCreditCardChargeAmount(entry.id, amount);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("updateCreditCardChargeAmount failed", err);
        setEntries((p) => p.map((e) => (e.id === entry.id ? prev : e)));
      }
    });
  };

  const handleDeleteCharge = (entry: LedgerEntry) => {
    if (entry.type !== "CREDIT_CARD") return;
    const prev = entry;
    setEntries((p) => p.filter((e) => e.id !== entry.id));
    startMutation(async () => {
      try {
        await deleteCreditCardCharge(entry.id);
      } catch (err) {
        toast.error("ลบไม่สำเร็จ");
        console.error("deleteCreditCardCharge failed", err);
        setEntries((p) => [...p, prev]);
      }
    });
  };

  // === installment mutations ===
  const handleCreatePlan = (d: PlanDraft) => {
    startMutation(async () => {
      try {
        const { plan, entries: added } = await createInstallmentPlan(d);
        setPlans((p) => [{ ...plan, paidCount: 0 }, ...p]);
        setInstallmentEntries((p) => [...p, ...added]);
        toast.success(`สร้างแผน "${plan.name}" + ${added.length} งวด`);
      } catch (err) {
        toast.error("สร้างแผนไม่สำเร็จ");
        console.error("createInstallmentPlan failed", err);
      }
    });
  };

  const handleToggleInstallmentPaid = (entryId: string) => {
    const target = installmentEntries.find((e) => e.id === entryId);
    if (!target) return;
    const next = !target.paid;
    setInstallmentEntries((p) =>
      p.map((e) =>
        e.id === entryId
          ? { ...e, paid: next, paidAt: next ? new Date() : null }
          : e
      )
    );
    if (target.sourceId) {
      const planId = target.sourceId;
      setPlans((p) =>
        p.map((pl) =>
          pl.id === planId
            ? { ...pl, paidCount: pl.paidCount + (next ? 1 : -1) }
            : pl
        )
      );
    }
    startMutation(async () => {
      try {
        await toggleInstallmentLedgerPaid(entryId, next);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("toggleInstallmentLedgerPaid failed", err);
        setInstallmentEntries((p) =>
          p.map((e) =>
            e.id === entryId
              ? { ...e, paid: !next, paidAt: !next ? new Date() : null }
              : e
          )
        );
        if (target.sourceId) {
          const planId = target.sourceId;
          setPlans((p) =>
            p.map((pl) =>
              pl.id === planId
                ? { ...pl, paidCount: pl.paidCount + (next ? -1 : 1) }
                : pl
            )
          );
        }
      }
    });
  };

  const handleUpdateInterestSplit = (
    entryId: string,
    principal: string,
    interest: string
  ) => {
    const prev = installmentEntries.find((e) => e.id === entryId);
    if (!prev) return;
    const total = (Number(principal) + Number(interest)).toFixed(2);
    setInstallmentEntries((p) =>
      p.map((e) =>
        e.id === entryId
          ? {
              ...e,
              principalAmount: principal,
              interestAmount: interest,
              amount: total,
            }
          : e
      )
    );
    startMutation(async () => {
      try {
        await updateLedgerInterestSplit(entryId, principal, interest);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("updateLedgerInterestSplit failed", err);
        setInstallmentEntries((p) =>
          p.map((e) => (e.id === entryId ? prev : e))
        );
      }
    });
  };

  const handleSettle = (d: SettleDraft) => {
    if (!settlingPlan) return;
    const planId = settlingPlan.id;
    setSettlingPlan(null);
    startMutation(async () => {
      try {
        await settleInstallmentEarly(
          planId,
          d.settlementAmount,
          d.closeYear,
          d.closeMonth
        );
        toast.success("ปิดยอดก่อนกำหนดเรียบร้อย");
        router.refresh();
      } catch (err) {
        toast.error("ปิดยอดไม่สำเร็จ");
        console.error("settleInstallmentEarly failed", err);
      }
    });
  };

  const confirmDeletePlan = () => {
    if (!deletingPlanId) return;
    const id = deletingPlanId;
    setDeletingPlanId(null);
    const removed = plans.find((p) => p.id === id);
    setPlans((p) => p.filter((pl) => pl.id !== id));
    setInstallmentEntries((p) => p.filter((e) => !(e.sourceId === id && !e.paid)));
    startMutation(async () => {
      try {
        await deleteInstallmentPlan(id);
        toast.success(`ลบแผน "${removed?.name ?? ""}" แล้ว`);
      } catch (err) {
        toast.error("ลบแผนไม่สำเร็จ");
        console.error("deleteInstallmentPlan failed", err);
        router.refresh();
      }
    });
  };

  const deletingCard = cards.find((c) => c.id === deletingCardId);
  const deletingPlan = plans.find((p) => p.id === deletingPlanId);
  const currentYm: YearMonth = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">บัตรเครดิต</h1>

      <Tabs defaultValue="statement">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0"
        >
          <TabsTrigger
            value="statement"
            className="-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!"
          >
            รายการชำระบัตรเครดิต
          </TabsTrigger>
          <TabsTrigger
            value="installment"
            className="-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!"
          >
            รายการผ่อนชำระ
          </TabsTrigger>
          <TabsTrigger
            value="mine"
            className="-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!"
          >
            บัตรของฉัน
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statement" className="mt-4">
          <StatementView
            ym={ym}
            cards={cards}
            plans={plans}
            entries={entries}
            onPrev={() => navigateMonth(-1)}
            onNext={() => navigateMonth(1)}
            onAddCharge={() => setChargeDialogOpen(true)}
            onTogglePaid={handleTogglePaidCharge}
            onUpdateAmount={handleUpdateAmount}
            onDelete={handleDeleteCharge}
          />
        </TabsContent>

        <TabsContent value="installment" className="mt-4">
          <InstallmentView
            cards={cards}
            plans={plans}
            entries={installmentEntries}
            categories={MOCK_CATEGORIES}
            onAddPlan={() => setPlanDialogOpen(true)}
            onTogglePaid={handleToggleInstallmentPaid}
            onUpdateInterestSplit={handleUpdateInterestSplit}
            onSettle={(p) => setSettlingPlan(p)}
            onDelete={(id) => setDeletingPlanId(id)}
          />
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <CardListView
            cards={cards}
            banks={MOCK_BANKS}
            onAdd={() => {
              setEditingCard(null);
              setCardDialogOpen(true);
            }}
            onEdit={(id) => {
              const c = cards.find((x) => x.id === id);
              if (!c) return;
              setEditingCard(c);
              setCardDialogOpen(true);
            }}
            onToggleActive={handleToggleCardActive}
            onDelete={(id) => setDeletingCardId(id)}
          />
        </TabsContent>
      </Tabs>

      <CardDialog
        open={cardDialogOpen}
        onOpenChange={(o) => {
          setCardDialogOpen(o);
          if (!o) setEditingCard(null);
        }}
        banks={MOCK_BANKS}
        initial={editingCard}
        onSubmit={handleSubmitCard}
      />

      <ChargeDialog
        open={chargeDialogOpen}
        onOpenChange={setChargeDialogOpen}
        cards={cards.filter((c) => c.active)}
        categories={MOCK_CATEGORIES}
        ym={ym}
        onSubmit={handleSubmitCharge}
      />

      <PlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        cards={cards.filter((c) => c.active)}
        categories={MOCK_CATEGORIES}
        defaultYm={currentYm}
        onSubmit={handleCreatePlan}
      />

      <SettleDialog
        open={settlingPlan !== null}
        onOpenChange={(o) => !o && setSettlingPlan(null)}
        planName={settlingPlan?.name ?? ""}
        defaultYm={currentYm}
        onSubmit={handleSettle}
      />

      <AlertDialog
        open={deletingCardId !== null}
        onOpenChange={(o) => !o && setDeletingCardId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบบัตร?</AlertDialogTitle>
            <AlertDialogDescription>
              ลบ &quot;{deletingCard?.name}&quot; — ถ้ามีแผนผ่อนผูกอยู่จะลบไม่ได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCard}>
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deletingPlanId !== null}
        onOpenChange={(o) => !o && setDeletingPlanId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบแผน?</AlertDialogTitle>
            <AlertDialogDescription>
              ลบ &quot;{deletingPlan?.name}&quot; และทุกงวดที่ยังไม่จ่าย — งวดที่จ่ายแล้วจะเก็บไว้ใน ledger
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePlan}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

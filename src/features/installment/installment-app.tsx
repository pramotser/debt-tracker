"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createCreditCard } from "@/server/actions/credit-cards";
import {
  createInstallmentPlan,
  deleteInstallmentPlan,
  settleInstallmentEarly,
  toggleInstallmentLedgerPaid,
  updateLedgerInterestSplit,
} from "@/server/actions/credit-card-installments";
import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";

import { CardDialog, type CardDraft } from "./card-dialog";
import { MOCK_BANKS, MOCK_CATEGORIES } from "./mock";
import { PlanCard } from "./plan-card";
import { PlanDialog, type PlanDraft } from "./plan-dialog";
import { RemainingBalanceCard } from "./remaining-balance-card";
import { SettleDialog, type SettleDraft } from "./settle-dialog";
import { SummaryCard } from "./summary-card";
import type { CreditCard, LedgerEntry, UiStatus } from "./types";
import { UpcomingList } from "./upcoming-list";

function toNumber(v: string | null): number {
  if (v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function uiStatusOf(
  plan: InstallmentPlanWithProgress
): UiStatus {
  if (plan.status === "early_settled") return "early-settlement";
  if (plan.paidCount >= plan.totalInstallments) return "completed";
  if (plan.totalInstallments - plan.paidCount <= 1) return "near-end";
  return "active";
}

export function InstallmentApp({
  initialCards,
  initialPlans,
  initialEntries,
  currentYm,
}: {
  initialCards: CreditCard[];
  initialPlans: InstallmentPlanWithProgress[];
  initialEntries: LedgerEntry[];
  currentYm: { year: number; month: number };
}) {
  const router = useRouter();
  const [cards, setCards] = useState<CreditCard[]>(initialCards);
  const [plans, setPlans] =
    useState<InstallmentPlanWithProgress[]>(initialPlans);
  const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
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

  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [settlingPlan, setSettlingPlan] =
    useState<InstallmentPlanWithProgress | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const cardById = useMemo(
    () => new Map(cards.map((c) => [c.id, c])),
    [cards]
  );
  const categoryById = new Map(MOCK_CATEGORIES.map((c) => [c.id, c]));

  const entriesByPlanId = useMemo(() => {
    const m = new Map<string, LedgerEntry[]>();
    for (const e of entries) {
      if (!e.sourceId) continue;
      const arr = m.get(e.sourceId) ?? [];
      arr.push(e);
      m.set(e.sourceId, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month));
    }
    return m;
  }, [entries]);

  // ภาพรวม
  const dueThisMonth = entries
    .filter(
      (e) => !e.paid && e.year === currentYm.year && e.month === currentYm.month
    )
    .reduce((s, e) => s + toNumber(e.amount), 0);

  const activePlanIds = new Set(
    plans.filter((p) => p.status !== "early_settled").map((p) => p.id)
  );
  const totalRemaining = entries
    .filter((e) => !e.paid && e.sourceId && activePlanIds.has(e.sourceId))
    .reduce((s, e) => s + toNumber(e.amount), 0);

  const buckets = useMemo(() => {
    const a: InstallmentPlanWithProgress[] = [];
    const n: InstallmentPlanWithProgress[] = [];
    const c: InstallmentPlanWithProgress[] = [];
    const e: InstallmentPlanWithProgress[] = [];
    for (const p of plans) {
      const s = uiStatusOf(p);
      if (s === "active") a.push(p);
      else if (s === "near-end") n.push(p);
      else if (s === "completed") c.push(p);
      else e.push(p);
    }
    return { active: a, nearEnd: n, completed: c, early: e };
  }, [plans]);

  // remaining balance card totals across active + near-end
  const inProgress = [...buckets.active, ...buckets.nearEnd];
  const totalInstallments = inProgress.reduce(
    (s, p) => s + p.totalInstallments,
    0
  );
  const paidInstallments = inProgress.reduce((s, p) => s + p.paidCount, 0);

  // upcoming = unpaid ledger of in-progress plans sorted by ym, top 5
  const upcoming = entries
    .filter(
      (e) =>
        !e.paid &&
        e.sourceId &&
        inProgress.some((p) => p.id === e.sourceId)
    )
    .slice()
    .sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month))
    .slice(0, 5);

  // ========= mutations =========
  const handleAddCard = (d: CardDraft) => {
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

  const handleCreatePlan = (d: PlanDraft) => {
    startMutation(async () => {
      try {
        const { plan, entries: added } = await createInstallmentPlan(d);
        setPlans((p) => [{ ...plan, paidCount: 0 }, ...p]);
        setEntries((p) => [...p, ...added]);
        toast.success(`สร้างแผน "${plan.name}" + ${added.length} งวด`);
      } catch (err) {
        toast.error("สร้างแผนไม่สำเร็จ");
        console.error("createInstallmentPlan failed", err);
      }
    });
  };

  const handleTogglePaid = (entryId: string) => {
    const target = entries.find((e) => e.id === entryId);
    if (!target) return;
    const next = !target.paid;
    setEntries((p) =>
      p.map((e) =>
        e.id === entryId
          ? { ...e, paid: next, paidAt: next ? new Date() : null }
          : e
      )
    );
    // bump paidCount on the plan
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
        // rollback
        setEntries((p) =>
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
    const prev = entries.find((e) => e.id === entryId);
    if (!prev) return;
    const total = (Number(principal) + Number(interest)).toFixed(2);
    setEntries((p) =>
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
        setEntries((p) => p.map((e) => (e.id === entryId ? prev : e)));
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

  const confirmDelete = () => {
    if (!deletingPlanId) return;
    const id = deletingPlanId;
    setDeletingPlanId(null);
    const removed = plans.find((p) => p.id === id);
    setPlans((p) => p.filter((pl) => pl.id !== id));
    setEntries((p) =>
      p.filter((e) => !(e.sourceId === id && !e.paid))
    );
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

  const deletingPlan = plans.find((p) => p.id === deletingPlanId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ผ่อนชำระ</h1>
          <p className="text-sm text-muted-foreground">
            ติดตามภาระการผ่อนทั้งหมดของคุณ
          </p>
        </div>
        <Button
          onClick={() => setPlanDialogOpen(true)}
          disabled={cards.length === 0}
        >
          <Plus />
          เพิ่มแผนผ่อน
        </Button>
      </div>

      {/* บัตรเครดิตของฉัน */}
      <Card className="gap-3 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">บัตรเครดิตของฉัน</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCardDialogOpen(true)}
          >
            <Plus />
            เพิ่มบัตร
          </Button>
        </div>
        {cards.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            ยังไม่มีบัตร — กด &quot;เพิ่มบัตร&quot; เพื่อสร้างบัตรก่อนสร้างแผนผ่อน
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cards.map((c) => (
              <div
                key={c.id}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
              >
                {c.name}
                {c.lastFourDigits && (
                  <span className="ml-1 text-muted-foreground">
                    ****{c.lastFourDigits}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <SummaryCard
        dueThisMonth={dueThisMonth}
        totalRemaining={totalRemaining}
        activeCount={buckets.active.length}
        nearEndCount={buckets.nearEnd.length}
      />

      {inProgress.length > 0 && (
        <Section title="ภาระการผ่อนคงเหลือ">
          <RemainingBalanceCard
            totalRemaining={totalRemaining}
            totalInstallments={totalInstallments}
            paidInstallments={paidInstallments}
          />
        </Section>
      )}

      <Section title="งวดที่จะถึง">
        <UpcomingList items={upcoming} onTogglePaid={handleTogglePaid} />
      </Section>

      {buckets.active.length > 0 && (
        <Section title="กำลังผ่อน">
          <div className="flex flex-col gap-3">
            {buckets.active.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                uiStatus="active"
                card={cardById.get(p.creditCardId)}
                category={categoryById.get(p.categoryId)}
                entries={entriesByPlanId.get(p.id) ?? []}
                onTogglePaid={handleTogglePaid}
                onUpdateInterestSplit={handleUpdateInterestSplit}
                onSettle={() => setSettlingPlan(p)}
                onDelete={() => setDeletingPlanId(p.id)}
              />
            ))}
          </div>
        </Section>
      )}

      {buckets.nearEnd.length > 0 && (
        <Section title="ใกล้จบ">
          <div className="flex flex-col gap-3">
            {buckets.nearEnd.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                uiStatus="near-end"
                card={cardById.get(p.creditCardId)}
                category={categoryById.get(p.categoryId)}
                entries={entriesByPlanId.get(p.id) ?? []}
                onTogglePaid={handleTogglePaid}
                onUpdateInterestSplit={handleUpdateInterestSplit}
                onSettle={() => setSettlingPlan(p)}
                onDelete={() => setDeletingPlanId(p.id)}
              />
            ))}
          </div>
        </Section>
      )}

      {buckets.completed.length > 0 && (
        <Section title="ผ่อนครบแล้ว">
          <div className="flex flex-col gap-3">
            {buckets.completed.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                uiStatus="completed"
                card={cardById.get(p.creditCardId)}
                category={categoryById.get(p.categoryId)}
                entries={entriesByPlanId.get(p.id) ?? []}
                onTogglePaid={handleTogglePaid}
                onUpdateInterestSplit={handleUpdateInterestSplit}
                onSettle={() => {}}
                onDelete={() => setDeletingPlanId(p.id)}
              />
            ))}
          </div>
        </Section>
      )}

      {buckets.early.length > 0 && (
        <Section title="ปิดก่อนกำหนด">
          <div className="flex flex-col gap-3">
            {buckets.early.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                uiStatus="early-settlement"
                card={cardById.get(p.creditCardId)}
                category={categoryById.get(p.categoryId)}
                entries={entriesByPlanId.get(p.id) ?? []}
                onTogglePaid={handleTogglePaid}
                onUpdateInterestSplit={handleUpdateInterestSplit}
                onSettle={() => {}}
                onDelete={() => setDeletingPlanId(p.id)}
              />
            ))}
          </div>
        </Section>
      )}

      <CardDialog
        open={cardDialogOpen}
        onOpenChange={setCardDialogOpen}
        banks={MOCK_BANKS}
        onSubmit={handleAddCard}
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
            <AlertDialogAction onClick={confirmDelete}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

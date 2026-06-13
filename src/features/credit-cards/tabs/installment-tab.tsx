"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type Dispatch, type SetStateAction } from "react";
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
import {
  createInstallmentPlan,
  deleteInstallmentPlan,
  settleInstallmentEarly,
  toggleInstallmentLedgerPaid,
  updateLedgerInterestSplit,
} from "@/server/actions/credit-card-installments";
import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";

import { InstallmentView } from "../installment-view";
import { MOCK_CATEGORIES } from "../mock";
import { PlanDialog, type PlanDraft } from "../plan-dialog";
import { SettleDialog, type SettleDraft } from "../settle-dialog";
import type { CreditCard, LedgerEntry } from "../types";

export function InstallmentTab({
  cards,
  plans,
  setPlans,
  entries,
  setEntries,
  scrollToPlanId,
  onScrolled,
}: {
  cards: CreditCard[];
  plans: InstallmentPlanWithProgress[];
  setPlans: Dispatch<SetStateAction<InstallmentPlanWithProgress[]>>;
  entries: LedgerEntry[];
  setEntries: Dispatch<SetStateAction<LedgerEntry[]>>;
  scrollToPlanId: string | null;
  onScrolled: () => void;
}) {
  const router = useRouter();
  const [, startMutation] = useTransition();
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [settlingPlan, setSettlingPlan] =
    useState<InstallmentPlanWithProgress | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const currentYm = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
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

  const confirmDeletePlan = () => {
    if (!deletingPlanId) return;
    const id = deletingPlanId;
    setDeletingPlanId(null);
    const removed = plans.find((p) => p.id === id);
    setPlans((p) => p.filter((pl) => pl.id !== id));
    setEntries((p) => p.filter((e) => !(e.sourceId === id && !e.paid)));
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
    <>
      <InstallmentView
        cards={cards}
        plans={plans}
        entries={entries}
        categories={MOCK_CATEGORIES}
        scrollToPlanId={scrollToPlanId}
        onScrolled={onScrolled}
        onAddPlan={() => setPlanDialogOpen(true)}
        onTogglePaid={handleTogglePaid}
        onUpdateInterestSplit={handleUpdateInterestSplit}
        onSettle={(p) => setSettlingPlan(p)}
        onDelete={(id) => setDeletingPlanId(id)}
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
            <AlertDialogAction onClick={confirmDeletePlan}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

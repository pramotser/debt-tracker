"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import {
  createCreditCardCharge,
  deleteCreditCardCharge,
  fetchCreditCardLedgerByMonth,
  toggleCreditCardChargePaid,
  updateCreditCardChargeAmount,
} from "@/server/actions/credit-card-charges";
import {
  toggleInstallmentLedgerPaid,
  updateLedgerInterestSplit,
} from "@/server/actions/credit-card-installments";
import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";
import { shiftMonth, ymKey } from "@/lib/month";

import { ChargeDialog, type ChargeDraft } from "../charge-dialog";
import { StatementView } from "../statement-view";
import type { Category, CreditCard, LedgerEntry, YearMonth } from "../types";

export function StatementTab({
  initialYm,
  initialEntries,
  cards,
  plans,
  categories,
  onJumpToPlan,
}: {
  initialYm: YearMonth;
  initialEntries: LedgerEntry[];
  cards: CreditCard[];
  plans: InstallmentPlanWithProgress[];
  categories: Category[];
  onJumpToPlan: (planId: string) => void;
}) {
  const [ym, setYm] = useState<YearMonth>(initialYm);
  const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
  const [, startMutation] = useTransition();
  const [isMonthLoading, startMonthChange] = useTransition();
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);

  // cache รายเดือน — key = "year-month" · seed จาก initial
  const monthCacheRef = useRef<Map<string, LedgerEntry[]>>(
    new Map([[ymKey(initialYm.year, initialYm.month), initialEntries]])
  );

  // ymRef = ค่าล่าสุดเสมอ ใช้เช็คใน async ว่ายังอยู่เดือนเดียวกันมั้ย
  const ymRef = useRef(ym);
  useEffect(() => {
    ymRef.current = ym;
  }, [ym]);

  const mutateCurrentMonth = useCallback(
    (updater: (prev: LedgerEntry[]) => LedgerEntry[]) => {
      setEntries((prev) => {
        const next = updater(prev);
        monthCacheRef.current.set(ymKey(ym.year, ym.month), next);
        return next;
      });
    },
    [ym.year, ym.month]
  );

  const navigateMonth = (delta: number) => {
    const next = shiftMonth(ym, delta);
    const key = ymKey(next.year, next.month);
    const cached = monthCacheRef.current.get(key);

    setYm(next);
    window.history.replaceState(null, "", `?y=${next.year}&m=${next.month}`);

    if (cached) {
      setEntries(cached);
      return;
    }

    setEntries([]);
    startMonthChange(async () => {
      try {
        const rows = await fetchCreditCardLedgerByMonth(next.year, next.month);
        monthCacheRef.current.set(key, rows);
        if (
          ymRef.current.year === next.year &&
          ymRef.current.month === next.month
        ) {
          setEntries(rows);
        }
      } catch (err) {
        toast.error("โหลดเดือนไม่สำเร็จ");
        console.error("fetchCreditCardLedgerByMonth failed", err);
      }
    });
  };

  // server เพิ่งส่ง initialEntries ใหม่ (router.refresh) → sync เข้า cache + state ถ้ายังอยู่เดือนเดิม
  useEffect(() => {
    monthCacheRef.current.set(
      ymKey(initialYm.year, initialYm.month),
      initialEntries
    );
    if (initialYm.year === ym.year && initialYm.month === ym.month) {
      setEntries(initialEntries);
    }
    // ตั้งใจไม่ใส่ ym ใน deps — sync เฉพาะตอน server ส่ง props ใหม่
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEntries, initialYm.year, initialYm.month]);

  const handleSubmitCharge = (d: ChargeDraft) => {
    startMutation(async () => {
      try {
        const row = await createCreditCardCharge(d);
        // ลงใน cache ของเดือนที่ user เลือกใส่ (อาจไม่ใช่เดือนปัจจุบัน)
        const key = ymKey(d.year, d.month);
        const prev = monthCacheRef.current.get(key) ?? [];
        monthCacheRef.current.set(key, [...prev, row]);
        if (d.year === ym.year && d.month === ym.month) {
          setEntries((p) => [...p, row]);
        }
      } catch (err) {
        toast.error("เพิ่มรายการไม่สำเร็จ");
        console.error("createCreditCardCharge failed", err);
      }
    });
  };

  // optimistic flip ทำใน StatementView (useOptimistic) — ที่นี่แค่ยิง action + กันให้ throw
  // เพื่อให้ useOptimistic rollback ได้ · revalidatePath จะ sync entries กลับเองทาง useEffect
  const handleTogglePaid = async (entry: LedgerEntry, next: boolean) => {
    try {
      if (entry.type === "CREDIT_CARD") {
        await toggleCreditCardChargePaid(entry.id, next);
      } else {
        await toggleInstallmentLedgerPaid(entry.id, next);
      }
    } catch (err) {
      toast.error("บันทึกไม่สำเร็จ");
      console.error("togglePaid failed", err);
      throw err;
    }
  };

  const handleUpdateAmount = (entry: LedgerEntry, amount: string) => {
    if (entry.type !== "CREDIT_CARD") return;
    const prev = entry;
    mutateCurrentMonth((p) =>
      p.map((e) => (e.id === entry.id ? { ...e, amount } : e))
    );
    startMutation(async () => {
      try {
        await updateCreditCardChargeAmount(entry.id, amount);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("updateCreditCardChargeAmount failed", err);
        mutateCurrentMonth((p) =>
          p.map((e) => (e.id === entry.id ? prev : e))
        );
      }
    });
  };

  const handleUpdateInterestSplit = (entry: LedgerEntry, principal: string, interest: string) => {
    const prev = entry;
    const amount = (Number(principal) + Number(interest)).toFixed(2);
    mutateCurrentMonth((p) =>
      p.map((e) =>
        e.id === entry.id ? { ...e, principalAmount: principal, interestAmount: interest, amount } : e
      )
    );
    startMutation(async () => {
      try {
        await updateLedgerInterestSplit(entry.id, principal, interest);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("updateLedgerInterestSplit failed", err);
        mutateCurrentMonth((p) => p.map((e) => (e.id === entry.id ? prev : e)));
      }
    });
  };

  const handleDelete = (entry: LedgerEntry) => {
    if (entry.type !== "CREDIT_CARD") return;
    const prev = entry;
    mutateCurrentMonth((p) => p.filter((e) => e.id !== entry.id));
    startMutation(async () => {
      try {
        await deleteCreditCardCharge(entry.id);
      } catch (err) {
        toast.error("ลบไม่สำเร็จ");
        console.error("deleteCreditCardCharge failed", err);
        mutateCurrentMonth((p) => [...p, prev]);
      }
    });
  };

  return (
    <>
      <StatementView
        ym={ym}
        cards={cards}
        plans={plans}
        entries={entries}
        loading={isMonthLoading}
        onPrev={() => navigateMonth(-1)}
        onNext={() => navigateMonth(1)}
        onAddCharge={() => setChargeDialogOpen(true)}
        onTogglePaid={handleTogglePaid}
        onUpdateAmount={handleUpdateAmount}
        onUpdateInterestSplit={handleUpdateInterestSplit}
        onDelete={handleDelete}
        onJumpToPlan={onJumpToPlan}
      />

      <ChargeDialog
        open={chargeDialogOpen}
        onOpenChange={setChargeDialogOpen}
        cards={cards.filter((c) => c.active)}
        categories={categories}
        ym={ym}
        onSubmit={handleSubmitCharge}
      />
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
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
import { toggleInstallmentLedgerPaid } from "@/server/actions/credit-card-installments";
import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";
import { shiftMonth, ymKey } from "@/lib/month";

import { ChargeDialog, type ChargeDraft } from "../charge-dialog";
import { MOCK_CATEGORIES } from "../mock";
import { StatementView } from "../statement-view";
import type { CreditCard, LedgerEntry, YearMonth } from "../types";

// best-effort idle scheduler (Safari ไม่มี requestIdleCallback)
function scheduleIdle(fn: () => void): void {
  type W = Window & {
    requestIdleCallback?: (cb: () => void) => number;
  };
  const w = window as W;
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(fn);
  } else {
    setTimeout(fn, 200);
  }
}

export function StatementTab({
  initialYm,
  initialEntries,
  cards,
  plans,
}: {
  initialYm: YearMonth;
  initialEntries: LedgerEntry[];
  cards: CreditCard[];
  plans: InstallmentPlanWithProgress[];
}) {
  const router = useRouter();
  const [ym, setYm] = useState<YearMonth>(initialYm);
  const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
  const [, startMutation] = useTransition();
  const [, startMonthChange] = useTransition();
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);

  // cache รายเดือน — key = "year-month" · seed จาก initial
  const monthCacheRef = useRef<Map<string, LedgerEntry[]>>(
    new Map([[ymKey(initialYm.year, initialYm.month), initialEntries]])
  );

  const setEntriesForMonth = useCallback(
    (year: number, month: number, next: LedgerEntry[]) => {
      monthCacheRef.current.set(ymKey(year, month), next);
      if (year === ym.year && month === ym.month) {
        setEntries(next);
      }
    },
    [ym.year, ym.month]
  );

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
    router.replace(`?y=${next.year}&m=${next.month}`, { scroll: false });

    if (cached) {
      setEntries(cached);
      return;
    }

    setEntries([]);
    startMonthChange(async () => {
      try {
        const rows = await fetchCreditCardLedgerByMonth(next.year, next.month);
        setEntriesForMonth(next.year, next.month, rows);
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

  // prefetch prev/next month เมื่อ idle
  useEffect(() => {
    const targets = [shiftMonth(ym, -1), shiftMonth(ym, 1)];
    let cancelled = false;
    scheduleIdle(() => {
      if (cancelled) return;
      for (const t of targets) {
        const key = ymKey(t.year, t.month);
        if (monthCacheRef.current.has(key)) continue;
        fetchCreditCardLedgerByMonth(t.year, t.month)
          .then((rows) => {
            if (cancelled) return;
            monthCacheRef.current.set(key, rows);
          })
          .catch(() => {
            // prefetch ล้มเหลวเงียบๆ — ค่อย fetch จริงตอนนาวิเกตเอง
          });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ym]);

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

  const handleTogglePaid = (entry: LedgerEntry) => {
    const next = !entry.paid;
    mutateCurrentMonth((p) =>
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
        mutateCurrentMonth((p) =>
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
        onPrev={() => navigateMonth(-1)}
        onNext={() => navigateMonth(1)}
        onAddCharge={() => setChargeDialogOpen(true)}
        onTogglePaid={handleTogglePaid}
        onUpdateAmount={handleUpdateAmount}
        onDelete={handleDelete}
      />

      <ChargeDialog
        open={chargeDialogOpen}
        onOpenChange={setChargeDialogOpen}
        cards={cards.filter((c) => c.active)}
        categories={MOCK_CATEGORIES}
        ym={ym}
        onSubmit={handleSubmitCharge}
      />
    </>
  );
}

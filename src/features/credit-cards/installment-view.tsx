"use client";

import { useMemo } from "react";
import { Info, Plus } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";

import { STATUS } from "./components/status-tokens";
import { SummaryStrip } from "./components/summary-strip";
import { PlanCard } from "./plan-card";
import type { Category, CreditCard, LedgerEntry, UiStatus } from "./types";

function uiStatusOf(plan: InstallmentPlanWithProgress): UiStatus {
  if (plan.status === "early_settled") return "early-settlement";
  if (plan.paidCount >= plan.totalInstallments) return "completed";
  if (plan.totalInstallments - plan.paidCount <= 1) return "near-end";
  return "active";
}

export function InstallmentView({
  cards,
  plans,
  entries,
  categories,
  scrollToPlanId,
  onScrolled,
  onAddPlan,
  onTogglePaid,
  onUpdateInterestSplit,
  onSettle,
  onDelete,
}: {
  cards: CreditCard[];
  plans: InstallmentPlanWithProgress[];
  entries: LedgerEntry[];
  categories: Category[];
  scrollToPlanId: string | null;
  onScrolled: () => void;
  onAddPlan: () => void;
  onTogglePaid: (entryId: string) => void;
  onUpdateInterestSplit: (
    entryId: string,
    principal: string,
    interest: string
  ) => void;
  onSettle: (plan: InstallmentPlanWithProgress) => void;
  onDelete: (planId: string) => void;
}) {
  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

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

  const summary = useMemo(() => {
    const openPlans = [...buckets.active, ...buckets.nearEnd];
    const openIds = new Set(openPlans.map((p) => p.id));
    const sumPerMonth = openPlans.reduce(
      (s, p) => s + Number(p.installmentAmount),
      0
    );
    const sumRemaining = entries
      .filter((e) => !e.paid && e.sourceId && openIds.has(e.sourceId))
      .reduce((s, e) => s + Number(e.amount), 0);
    return {
      sumRemaining,
      sumPerMonth,
      activeCount: buckets.active.length,
      nearEndCount: buckets.nearEnd.length,
    };
  }, [buckets, entries]);

  const renderPlan = (p: InstallmentPlanWithProgress, status: UiStatus) => (
    <PlanCard
      key={p.id}
      plan={p}
      uiStatus={status}
      card={cardById.get(p.creditCardId)}
      category={categoryById.get(p.categoryId)}
      entries={entriesByPlanId.get(p.id) ?? []}
      scrollTarget={scrollToPlanId === p.id}
      onScrolled={onScrolled}
      onTogglePaid={onTogglePaid}
      onUpdateInterestSplit={onUpdateInterestSplit}
      onSettle={() => onSettle(p)}
      onDelete={() => onDelete(p.id)}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      <Alert>
        <Info />
        <AlertDescription>
          แท็บนี้แสดงแผนผ่อนระยะยาวทั้งหมดที่คุณมี ไม่ขึ้นตรงกับการเลื่อนดูรายเดือน
          เพื่อมอนิเตอร์ภาพรวมของหนี้ปัจจุบัน
        </AlertDescription>
      </Alert>

      {plans.length > 0 && (
        <SummaryStrip
          items={[
            { label: "คงเหลือ", value: formatMoney(summary.sumRemaining) },
            {
              label: "ต้องจ่าย/เดือน",
              value: formatMoney(summary.sumPerMonth),
            },
            {
              label: "กำลังผ่อน",
              value: String(summary.activeCount),
              tone: "active",
            },
            {
              label: "ใกล้จบ",
              value: String(summary.nearEndCount),
              tone: "nearEnd",
            },
          ]}
        />
      )}

      <div className="flex justify-end">
        <Button onClick={onAddPlan} disabled={cards.length === 0}>
          <Plus />
          เพิ่มแผนผ่อน
        </Button>
      </div>

      {plans.length === 0 && (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีแผนผ่อน — กด &quot;เพิ่มแผนผ่อน&quot; เพื่อเริ่ม
        </Card>
      )}

      {buckets.active.length > 0 && (
        <Section title="กำลังผ่อน" dotColor={STATUS.active.bar}>
          {buckets.active.map((p) => renderPlan(p, "active"))}
        </Section>
      )}

      {buckets.nearEnd.length > 0 && (
        <Section title="ใกล้จบ" dotColor={STATUS.nearEnd.bar}>
          {buckets.nearEnd.map((p) => renderPlan(p, "near-end"))}
        </Section>
      )}

      {buckets.early.length > 0 && (
        <Section title="ปิดก่อนกำหนด" dotColor={STATUS.settle.bar}>
          {buckets.early.map((p) => renderPlan(p, "early-settlement"))}
        </Section>
      )}

      {buckets.completed.length > 0 && (
        <Section title="ผ่อนครบแล้ว" dotColor={STATUS.off.bar}>
          {buckets.completed.map((p) => renderPlan(p, "completed"))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  dotColor,
  children,
}: {
  title: string;
  dotColor: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <span
          aria-hidden
          className="inline-block size-2.5 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

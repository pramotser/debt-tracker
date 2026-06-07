"use client";

import { useMemo } from "react";
import { Info, Plus } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { InstallmentPlanWithProgress } from "@/server/queries/credit-card-installments";

import { PlanCard } from "./plan-card";
import type {
  Category,
  CreditCard,
  LedgerEntry,
  UiStatus,
} from "./types";

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

  const renderPlan = (p: InstallmentPlanWithProgress, status: UiStatus) => (
    <PlanCard
      key={p.id}
      plan={p}
      uiStatus={status}
      card={cardById.get(p.creditCardId)}
      category={categoryById.get(p.categoryId)}
      entries={entriesByPlanId.get(p.id) ?? []}
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
        <Section title="กำลังผ่อน">
          {buckets.active.map((p) => renderPlan(p, "active"))}
        </Section>
      )}

      {buckets.nearEnd.length > 0 && (
        <Section title="ใกล้จบ">
          {buckets.nearEnd.map((p) => renderPlan(p, "near-end"))}
        </Section>
      )}

      {buckets.completed.length > 0 && (
        <Section title="ผ่อนครบแล้ว">
          {buckets.completed.map((p) => renderPlan(p, "completed"))}
        </Section>
      )}

      {buckets.early.length > 0 && (
        <Section title="ปิดก่อนกำหนด">
          {buckets.early.map((p) => renderPlan(p, "early-settlement"))}
        </Section>
      )}
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
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

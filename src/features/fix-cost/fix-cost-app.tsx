"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

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
  createTemplate,
  deleteTemplate,
  toggleTemplateActive,
  updateTemplateDefaultAmount,
} from "@/server/actions/fixed-cost-templates";
import {
  createLedgerEntry,
  deleteLedgerEntry,
  pullTemplatesIntoMonth,
  toggleLedgerEntryPaid,
  updateLedgerEntryAmount,
} from "@/server/actions/ledger-entries";

import { AddItemDialog, type ItemDraft } from "./item-dialog";
import { DEV_USER_ID, MOCK_CATEGORIES } from "./mock";
import { MonthView } from "./month-view";
import { AddTemplateDialog, type TemplateDraft } from "./template-dialog";
import { TemplateView } from "./template-view";
import type { FixedCostTemplate, LedgerEntry, YearMonth } from "./types";

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

function normalizeName(s: string) {
  return s.trim().toLocaleLowerCase("th");
}

export function FixCostApp({
  initialTemplates,
  initialEntries,
  ym,
}: {
  initialTemplates: FixedCostTemplate[];
  initialEntries: LedgerEntry[];
  ym: YearMonth;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
  const [templates, setTemplates] =
    useState<FixedCostTemplate[]>(initialTemplates);
  const [, startTemplateMutation] = useTransition();
  const [, startEntryMutation] = useTransition();

  // sync state when server re-renders (month change / revalidate)
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);
  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addTemplateOpen, setAddTemplateOpen] = useState(false);
  const [pendingDeleteTemplateId, setPendingDeleteTemplateId] = useState<
    string | null
  >(null);
  const [pullConfirmOpen, setPullConfirmOpen] = useState(false);
  const [pendingPullCounts, setPendingPullCounts] = useState<{
    addCount: number;
    replaceCount: number;
  } | null>(null);

  const navigateMonth = (delta: number) => {
    const next = shiftMonth(ym, delta);
    router.push(`?y=${next.year}&m=${next.month}`);
  };

  // === entry mutations ===
  const handleTogglePaid = (id: string) => {
    const target = entries.find((e) => e.id === id);
    if (!target) return;
    const next = !target.paid;
    setEntries((p) =>
      p.map((e) =>
        e.id === id
          ? { ...e, paid: next, paidAt: next ? new Date() : null }
          : e
      )
    );
    startEntryMutation(async () => {
      try {
        await toggleLedgerEntryPaid(id, next);
      } catch (err) {
        console.error("toggleLedgerEntryPaid failed", err);
        setEntries((p) =>
          p.map((e) =>
            e.id === id
              ? { ...e, paid: !next, paidAt: !next ? new Date() : null }
              : e
          )
        );
      }
    });
  };

  const handleUpdateAmount = (id: string, amount: string | null) => {
    const prev = entries.find((e) => e.id === id);
    if (!prev) return;
    setEntries((p) => p.map((e) => (e.id === id ? { ...e, amount } : e)));
    startEntryMutation(async () => {
      try {
        await updateLedgerEntryAmount(id, amount);
      } catch (err) {
        console.error("updateLedgerEntryAmount failed", err);
        setEntries((p) =>
          p.map((e) => (e.id === id ? { ...e, amount: prev.amount } : e))
        );
      }
    });
  };

  const handleDeleteEntry = (id: string) => {
    const prev = entries.find((e) => e.id === id);
    setEntries((p) => p.filter((e) => e.id !== id));
    startEntryMutation(async () => {
      try {
        await deleteLedgerEntry(id);
      } catch (err) {
        console.error("deleteLedgerEntry failed", err);
        if (prev) setEntries((p) => [...p, prev]);
      }
    });
  };

  const submitItem = (d: ItemDraft) => {
    const now = new Date();
    const tempId = `tmp-${Date.now()}`;
    const optimistic: LedgerEntry = {
      id: tempId,
      userId: DEV_USER_ID,
      categoryId: d.categoryId,
      sourceType: null,
      sourceId: null,
      type: "ONE_TIME_COST",
      name: d.name,
      amount: d.amount,
      principalAmount: null,
      interestAmount: null,
      year: ym.year,
      month: ym.month,
      paid: false,
      paidAt: null,
      note: null,
      createdAt: now,
      updatedAt: now,
    };
    setEntries((p) => [...p, optimistic]);
    startEntryMutation(async () => {
      try {
        const row = await createLedgerEntry({
          name: d.name,
          categoryId: d.categoryId,
          amount: d.amount,
          year: ym.year,
          month: ym.month,
        });
        setEntries((p) => p.map((e) => (e.id === tempId ? row : e)));
      } catch (err) {
        console.error("createLedgerEntry failed", err);
        setEntries((p) => p.filter((e) => e.id !== tempId));
      }
    });

    if (d.saveAsTemplate) {
      const exists = templates.some(
        (t) => normalizeName(t.name) === normalizeName(d.name)
      );
      if (!exists) {
        persistNewTemplate({
          name: d.name,
          categoryId: d.categoryId,
          defaultAmount: d.amount,
        });
      }
    }
  };

  // === pull templates → ledger ===
  const pullTemplates = () => {
    const existingByName = new Map(
      entries.map((e) => [normalizeName(e.name), e])
    );
    let addCount = 0;
    let replaceCount = 0;
    for (const t of templates) {
      if (!t.active) continue;
      if (existingByName.has(normalizeName(t.name))) replaceCount += 1;
      else addCount += 1;
    }
    if (addCount === 0 && replaceCount === 0) return;
    if (replaceCount === 0) {
      commitPull(false);
      return;
    }
    setPendingPullCounts({ addCount, replaceCount });
    setPullConfirmOpen(true);
  };

  const commitPull = (replaceConflicts: boolean) => {
    startEntryMutation(async () => {
      try {
        const { added, replacedIds } = await pullTemplatesIntoMonth(
          ym.year,
          ym.month,
          replaceConflicts
        );
        const replacedSet = new Set(replacedIds);
        setEntries((p) => {
          // remove replaced rows (action returned fresh data, but we don't have it here)
          // simpler: trigger a refresh so server sends fresh entries
          const kept = p.filter((e) => !replacedSet.has(e.id));
          return [...kept, ...added];
        });
        // ask server to re-render so replaced rows update too
        router.refresh();
      } catch (err) {
        console.error("pullTemplatesIntoMonth failed", err);
      }
    });
    setPullConfirmOpen(false);
    setPendingPullCounts(null);
  };

  // === template mutations ===
  const persistNewTemplate = (input: {
    name: string;
    categoryId: string;
    defaultAmount: string | null;
  }) => {
    const now = new Date();
    const tempId = `tmp-${Date.now()}`;
    const optimistic: FixedCostTemplate = {
      id: tempId,
      userId: DEV_USER_ID,
      categoryId: input.categoryId,
      name: input.name,
      defaultAmount: input.defaultAmount,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    setTemplates((p) => [...p, optimistic]);
    startTemplateMutation(async () => {
      try {
        const row = await createTemplate(input);
        setTemplates((p) => p.map((t) => (t.id === tempId ? row : t)));
      } catch (e) {
        console.error("createTemplate failed", e);
        setTemplates((p) => p.filter((t) => t.id !== tempId));
      }
    });
  };

  const submitTemplate = (d: TemplateDraft) =>
    persistNewTemplate({
      name: d.name,
      categoryId: d.categoryId,
      defaultAmount: d.defaultAmount,
    });

  const handleToggleTemplateActive = (id: string) => {
    const target = templates.find((t) => t.id === id);
    if (!target) return;
    const next = !target.active;
    setTemplates((p) =>
      p.map((t) =>
        t.id === id ? { ...t, active: next, updatedAt: new Date() } : t
      )
    );
    startTemplateMutation(async () => {
      try {
        await toggleTemplateActive(id, next);
      } catch (e) {
        console.error("toggleTemplateActive failed", e);
        setTemplates((p) =>
          p.map((t) => (t.id === id ? { ...t, active: !next } : t))
        );
      }
    });
  };

  const handleUpdateTemplateDefaultAmount = (
    id: string,
    amount: string | null
  ) => {
    const prev = templates.find((t) => t.id === id);
    if (!prev) return;
    setTemplates((p) =>
      p.map((t) =>
        t.id === id
          ? { ...t, defaultAmount: amount, updatedAt: new Date() }
          : t
      )
    );
    startTemplateMutation(async () => {
      try {
        await updateTemplateDefaultAmount(id, amount);
      } catch (e) {
        console.error("updateTemplateDefaultAmount failed", e);
        setTemplates((p) =>
          p.map((t) =>
            t.id === id ? { ...t, defaultAmount: prev.defaultAmount } : t
          )
        );
      }
    });
  };

  const confirmDeleteTemplate = () => {
    if (!pendingDeleteTemplateId) return;
    const id = pendingDeleteTemplateId;
    const prev = templates.find((t) => t.id === id);
    setTemplates((p) => p.filter((t) => t.id !== id));
    setPendingDeleteTemplateId(null);
    startTemplateMutation(async () => {
      try {
        await deleteTemplate(id);
      } catch (e) {
        console.error("deleteTemplate failed", e);
        if (prev) setTemplates((p) => [...p, prev]);
      }
    });
  };

  const pendingDeleteTemplate = templates.find(
    (t) => t.id === pendingDeleteTemplateId
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">ค่าใช้จ่ายรายเดือน</h1>

      <Tabs defaultValue="month">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0"
        >
          <TabsTrigger
            value="month"
            className="-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!"
          >
            รายการจ่ายรายเดือน
          </TabsTrigger>
          <TabsTrigger
            value="tpl"
            className="-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!"
          >
            Template รายการจ่ายประจำ
          </TabsTrigger>
        </TabsList>
        <TabsContent value="month" className="mt-4">
          <MonthView
            ym={ym}
            items={entries}
            categories={MOCK_CATEGORIES}
            onPrev={() => navigateMonth(-1)}
            onNext={() => navigateMonth(1)}
            onTogglePaid={handleTogglePaid}
            onUpdateAmount={handleUpdateAmount}
            onDelete={handleDeleteEntry}
            onAdd={() => setAddItemOpen(true)}
            onPullTemplates={pullTemplates}
          />
        </TabsContent>
        <TabsContent value="tpl" className="mt-4">
          <TemplateView
            templates={templates}
            categories={MOCK_CATEGORIES}
            onAdd={() => setAddTemplateOpen(true)}
            onToggleActive={handleToggleTemplateActive}
            onUpdateDefaultAmount={handleUpdateTemplateDefaultAmount}
            onDelete={(id) => setPendingDeleteTemplateId(id)}
          />
        </TabsContent>
      </Tabs>

      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        categories={MOCK_CATEGORIES}
        onSubmit={submitItem}
      />

      <AddTemplateDialog
        open={addTemplateOpen}
        onOpenChange={setAddTemplateOpen}
        categories={MOCK_CATEGORIES}
        onSubmit={submitTemplate}
      />

      <AlertDialog
        open={pendingDeleteTemplateId !== null}
        onOpenChange={(o) => !o && setPendingDeleteTemplateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ template?</AlertDialogTitle>
            <AlertDialogDescription>
              ลบ &quot;{pendingDeleteTemplate?.name}&quot; ออกจากรายการ template
              รายการที่เคยดึงเข้าเดือนแล้วจะไม่ถูกลบ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTemplate}>
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pullConfirmOpen} onOpenChange={setPullConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>มีรายการชื่อซ้ำ</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPullCounts?.replaceCount} รายการในเดือนนี้ชื่อซ้ำกับ
              template ยืนยันเพื่อแทนที่ด้วยค่าจาก template
              {pendingPullCounts?.addCount
                ? ` (และเพิ่ม ${pendingPullCounts.addCount} รายการใหม่)`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingPullCounts(null);
                setPullConfirmOpen(false);
              }}
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => commitPull(true)}>
              ยืนยันแทนที่
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

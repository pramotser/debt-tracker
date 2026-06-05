"use client";

import { useMemo, useState } from "react";

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

import { AddItemDialog, type ItemDraft } from "./item-dialog";
import {
  CURRENT_YM,
  DEV_USER_ID,
  MOCK_CATEGORIES,
  MOCK_LEDGER_ENTRIES,
  MOCK_TEMPLATES,
} from "./mock";
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

export function FixCostApp() {
  const [ym, setYm] = useState<YearMonth>(CURRENT_YM);
  const [entries, setEntries] = useState<LedgerEntry[]>(MOCK_LEDGER_ENTRIES);
  const [templates, setTemplates] =
    useState<FixedCostTemplate[]>(MOCK_TEMPLATES);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addTemplateOpen, setAddTemplateOpen] = useState(false);
  const [pendingDeleteTemplateId, setPendingDeleteTemplateId] = useState<
    string | null
  >(null);
  const [pullConfirmOpen, setPullConfirmOpen] = useState(false);
  const [pendingPull, setPendingPull] = useState<{
    toAdd: LedgerEntry[];
    toReplace: { existingId: string; template: FixedCostTemplate }[];
  } | null>(null);

  const monthEntries = useMemo(
    () => entries.filter((e) => e.year === ym.year && e.month === ym.month),
    [entries, ym]
  );

  const togglePaid = (id: string) =>
    setEntries((p) =>
      p.map((e) => {
        if (e.id !== id) return e;
        const next = !e.paid;
        return { ...e, paid: next, paidAt: next ? new Date() : null };
      })
    );

  const updateAmount = (id: string, amount: string | null) =>
    setEntries((p) => p.map((e) => (e.id === id ? { ...e, amount } : e)));

  const deleteEntry = (id: string) =>
    setEntries((p) => p.filter((e) => e.id !== id));

  const submitItem = (d: ItemDraft) => {
    const now = new Date();
    const newEntry: LedgerEntry = {
      id: `le-${Date.now()}`,
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
    setEntries((p) => [...p, newEntry]);
    if (d.saveAsTemplate) {
      const exists = templates.some(
        (t) => normalizeName(t.name) === normalizeName(d.name)
      );
      if (!exists) {
        setTemplates((p) => [
          ...p,
          {
            id: `tpl-${Date.now()}`,
            userId: DEV_USER_ID,
            categoryId: d.categoryId,
            name: d.name,
            defaultAmount: d.amount,
            active: true,
            createdAt: now,
            updatedAt: now,
          },
        ]);
      }
    }
  };

  const submitTemplate = (d: TemplateDraft) => {
    const now = new Date();
    setTemplates((p) => [
      ...p,
      {
        id: `tpl-${Date.now()}`,
        userId: DEV_USER_ID,
        categoryId: d.categoryId,
        name: d.name,
        defaultAmount: d.defaultAmount,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  };

  const toggleTemplateActive = (id: string) =>
    setTemplates((p) =>
      p.map((t) =>
        t.id === id ? { ...t, active: !t.active, updatedAt: new Date() } : t
      )
    );

  const updateTemplateDefaultAmount = (id: string, amount: string | null) =>
    setTemplates((p) =>
      p.map((t) =>
        t.id === id
          ? { ...t, defaultAmount: amount, updatedAt: new Date() }
          : t
      )
    );

  const confirmDeleteTemplate = () => {
    if (!pendingDeleteTemplateId) return;
    setTemplates((p) => p.filter((t) => t.id !== pendingDeleteTemplateId));
    setPendingDeleteTemplateId(null);
  };

  const pendingDeleteTemplate = templates.find(
    (t) => t.id === pendingDeleteTemplateId
  );

  const pullTemplates = () => {
    const existingByName = new Map(
      monthEntries.map((e) => [normalizeName(e.name), e])
    );
    const now = new Date();
    const toAdd: LedgerEntry[] = [];
    const toReplace: { existingId: string; template: FixedCostTemplate }[] = [];
    for (const t of templates) {
      if (!t.active) continue;
      const exist = existingByName.get(normalizeName(t.name));
      if (exist) {
        toReplace.push({ existingId: exist.id, template: t });
      } else {
        toAdd.push({
          id: `le-${Date.now()}-${t.id}`,
          userId: DEV_USER_ID,
          categoryId: t.categoryId,
          sourceType: "fixed_cost_template",
          sourceId: t.id,
          type: "FIXED_COST",
          name: t.name,
          amount: t.defaultAmount,
          principalAmount: null,
          interestAmount: null,
          year: ym.year,
          month: ym.month,
          paid: false,
          paidAt: null,
          note: null,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    if (toReplace.length === 0) {
      setEntries((p) => [...p, ...toAdd]);
      return;
    }
    setPendingPull({ toAdd, toReplace });
    setPullConfirmOpen(true);
  };

  const confirmPull = () => {
    if (!pendingPull) return;
    const replaceMap = new Map(
      pendingPull.toReplace.map((r) => [r.existingId, r.template])
    );
    const now = new Date();
    setEntries((p) => {
      const replaced = p.map((e) => {
        const t = replaceMap.get(e.id);
        if (!t) return e;
        return {
          ...e,
          categoryId: t.categoryId,
          sourceType: "fixed_cost_template",
          sourceId: t.id,
          type: "FIXED_COST" as const,
          name: t.name,
          amount: t.defaultAmount,
          updatedAt: now,
        };
      });
      return [...replaced, ...pendingPull.toAdd];
    });
    setPullConfirmOpen(false);
    setPendingPull(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">ค่าใช้จ่ายรายเดือน</h1>

      <Tabs defaultValue="month">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0"
        >
          {/* base TabsTrigger มี `border` (1px ทุกด้าน) — ต้อง border-0 ก่อนแล้ว
              ค่อย border-b-2 เพื่อให้เหลือเส้นใต้อย่างเดียว (กัน "กล่อง outline") */}
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
            items={monthEntries}
            categories={MOCK_CATEGORIES}
            onPrev={() => setYm((p) => shiftMonth(p, -1))}
            onNext={() => setYm((p) => shiftMonth(p, 1))}
            onTogglePaid={togglePaid}
            onUpdateAmount={updateAmount}
            onDelete={deleteEntry}
            onAdd={() => setAddItemOpen(true)}
            onPullTemplates={pullTemplates}
          />
        </TabsContent>
        <TabsContent value="tpl" className="mt-4">
          <TemplateView
            templates={templates}
            categories={MOCK_CATEGORIES}
            onAdd={() => setAddTemplateOpen(true)}
            onToggleActive={toggleTemplateActive}
            onUpdateDefaultAmount={updateTemplateDefaultAmount}
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
              {pendingPull?.toReplace.length} รายการในเดือนนี้ชื่อซ้ำกับ
              template ยืนยันเพื่อแทนที่ด้วยค่าจาก template
              {pendingPull?.toAdd.length
                ? ` (และเพิ่ม ${pendingPull.toAdd.length} รายการใหม่)`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPull(null)}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPull}>
              ยืนยันแทนที่
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

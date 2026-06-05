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
import { yearMonthKey } from "@/lib/format";

import { AddItemDialog, type ItemDraft } from "./item-dialog";
import {
  CURRENT_YM,
  MOCK_CATEGORIES,
  MOCK_ITEMS,
  MOCK_MONTH_CLOSES,
  MOCK_TEMPLATES,
} from "./mock";
import { MonthView } from "./month-view";
import { AddTemplateDialog, type TemplateDraft } from "./template-dialog";
import { TemplateView } from "./template-view";
import type { FixCostItem, MonthClose, Template, YearMonth } from "./types";

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
  const [items, setItems] = useState<FixCostItem[]>(MOCK_ITEMS);
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const [monthCloses, setMonthCloses] =
    useState<MonthClose[]>(MOCK_MONTH_CLOSES);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addTemplateOpen, setAddTemplateOpen] = useState(false);
  const [pendingDeleteTemplateId, setPendingDeleteTemplateId] = useState<
    string | null
  >(null);
  const [pullConfirmOpen, setPullConfirmOpen] = useState(false);
  const [pendingPull, setPendingPull] = useState<{
    toAdd: FixCostItem[];
    toReplace: { existingId: string; template: Template }[];
  } | null>(null);

  const currentKey = yearMonthKey(ym.year, ym.month);
  const todayKey = yearMonthKey(CURRENT_YM.year, CURRENT_YM.month);
  const isPast = currentKey < todayKey;

  const monthItems = useMemo(
    () => items.filter((i) => i.year === ym.year && i.month === ym.month),
    [items, ym]
  );

  const closed = monthCloses.some(
    (mc) => mc.year === ym.year && mc.month === ym.month && mc.closed
  );

  const togglePaid = (id: string) =>
    setItems((p) =>
      p.map((i) => (i.id === id ? { ...i, paid: !i.paid } : i))
    );

  const updateAmount = (id: string, amount: number | undefined) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, amount } : i)));

  const deleteItem = (id: string) =>
    setItems((p) => p.filter((i) => i.id !== id));

  const closeMonth = () =>
    setMonthCloses((p) => {
      const idx = p.findIndex(
        (mc) => mc.year === ym.year && mc.month === ym.month
      );
      if (idx >= 0) {
        const next = [...p];
        next[idx] = { ...next[idx], closed: true };
        return next;
      }
      return [...p, { year: ym.year, month: ym.month, closed: true }];
    });

  const submitItem = (d: ItemDraft) => {
    const newItem: FixCostItem = {
      id: `it-${Date.now()}`,
      year: ym.year,
      month: ym.month,
      name: d.name,
      amount: d.amount,
      categoryId: d.categoryId,
      paid: false,
    };
    setItems((p) => [...p, newItem]);
    if (d.saveAsTemplate) {
      const exists = templates.some(
        (t) => normalizeName(t.name) === normalizeName(d.name)
      );
      if (!exists) {
        setTemplates((p) => [
          ...p,
          {
            id: `tpl-${Date.now()}`,
            name: d.name,
            amount: d.amount,
            categoryId: d.categoryId,
          },
        ]);
      }
    }
  };

  const submitTemplate = (d: TemplateDraft) => {
    setTemplates((p) => [
      ...p,
      {
        id: `tpl-${Date.now()}`,
        name: d.name,
        amount: d.amount,
        categoryId: d.categoryId,
      },
    ]);
  };

  const confirmDeleteTemplate = () => {
    if (!pendingDeleteTemplateId) return;
    setTemplates((p) => p.filter((t) => t.id !== pendingDeleteTemplateId));
    setPendingDeleteTemplateId(null);
  };

  const pendingDeleteTemplate = templates.find(
    (t) => t.id === pendingDeleteTemplateId
  );

  const pullTemplates = () => {
    if (isPast) return;
    const existingByName = new Map(
      monthItems.map((i) => [normalizeName(i.name), i])
    );
    const toAdd: FixCostItem[] = [];
    const toReplace: { existingId: string; template: Template }[] = [];
    for (const t of templates) {
      const exist = existingByName.get(normalizeName(t.name));
      if (exist) {
        toReplace.push({ existingId: exist.id, template: t });
      } else {
        toAdd.push({
          id: `it-${Date.now()}-${t.id}`,
          year: ym.year,
          month: ym.month,
          name: t.name,
          amount: t.amount,
          categoryId: t.categoryId,
          paid: false,
        });
      }
    }
    if (toReplace.length === 0) {
      setItems((p) => [...p, ...toAdd]);
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
    setItems((p) => {
      const replaced = p.map((i) => {
        const t = replaceMap.get(i.id);
        if (!t) return i;
        return {
          ...i,
          name: t.name,
          amount: t.amount,
          categoryId: t.categoryId,
        };
      });
      return [...replaced, ...pendingPull.toAdd];
    });
    setPullConfirmOpen(false);
    setPendingPull(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">ค่าใช้จ่ายประจำ</h1>

      <Tabs defaultValue="month">
        <TabsList>
          <TabsTrigger value="month">รายการเดือนนี้</TabsTrigger>
          <TabsTrigger value="tpl">Template</TabsTrigger>
        </TabsList>
        <TabsContent value="month" className="mt-4">
          <MonthView
            ym={ym}
            isPast={isPast}
            closed={closed}
            items={monthItems}
            categories={MOCK_CATEGORIES}
            onPrev={() => setYm((p) => shiftMonth(p, -1))}
            onNext={() => setYm((p) => shiftMonth(p, 1))}
            onTogglePaid={togglePaid}
            onUpdateAmount={updateAmount}
            onDelete={deleteItem}
            onCloseMonth={closeMonth}
            onAdd={() => setAddItemOpen(true)}
            onPullTemplates={pullTemplates}
          />
        </TabsContent>
        <TabsContent value="tpl" className="mt-4">
          <TemplateView
            templates={templates}
            categories={MOCK_CATEGORIES}
            onAdd={() => setAddTemplateOpen(true)}
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

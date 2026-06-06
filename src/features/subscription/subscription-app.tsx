"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
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
  deleteSubscriptionLedger,
  importSubscriptionsToMonth,
  toggleSubscriptionPaid,
  updateSubscriptionAmount,
} from "@/server/actions/subscription-ledger";
import {
  createSubscriptionTemplate,
  deleteSubscriptionTemplate,
  toggleSubscriptionTemplateActive,
  updateSubscriptionTemplate,
} from "@/server/actions/subscription-templates";

import { ImportModal } from "./import-modal";
import { MOCK_CATEGORIES } from "./mock";
import { MonthView } from "./month-view";
import { TemplateDialog, type TemplateDraft } from "./template-dialog";
import { TemplateView } from "./template-view";
import type { LedgerEntry, SubscriptionTemplate, YearMonth } from "./types";

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

function ymKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export function SubscriptionApp({
  initialTemplates,
  initialEntries,
  ym,
}: {
  initialTemplates: SubscriptionTemplate[];
  initialEntries: LedgerEntry[];
  ym: YearMonth;
}) {
  const router = useRouter();
  const [templates, setTemplates] =
    useState<SubscriptionTemplate[]>(initialTemplates);
  const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
  const [, startMutation] = useTransition();

  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<SubscriptionTemplate | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [dismissedMonths, setDismissedMonths] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingDeleteTemplateId, setPendingDeleteTemplateId] = useState<
    string | null
  >(null);
  const [pendingDeleteLedgerId, setPendingDeleteLedgerId] = useState<
    string | null
  >(null);

  const navigateMonth = (delta: number) => {
    const next = shiftMonth(ym, delta);
    router.push(`?y=${next.year}&m=${next.month}`);
  };

  const templatesById = useMemo(
    () => new Map(templates.map((t) => [t.id, t])),
    [templates]
  );

  // pending = active templates ที่ยังไม่มี ledger row ในเดือนนี้ (และ yearly ต้องตรงเดือน)
  const pendingTemplates = useMemo(() => {
    const usedSourceIds = new Set(
      entries
        .filter((e) => e.sourceType === "subscription_template")
        .map((e) => e.sourceId)
        .filter((v): v is string => v !== null)
    );
    return templates.filter((t) => {
      if (!t.active) return false;
      if (usedSourceIds.has(t.id)) return false;
      if (t.billingCycle === "yearly") {
        if (!t.renewDate) return false;
        const monthPart = Number(t.renewDate.split("-")[1]);
        if (monthPart !== ym.month) return false;
      }
      return true;
    });
  }, [templates, entries, ym.month]);

  const bannerDismissed = dismissedMonths.has(ymKey(ym.year, ym.month));

  // === ledger mutations ===
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
    startMutation(async () => {
      try {
        await toggleSubscriptionPaid(id, next);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("toggleSubscriptionPaid failed", err);
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

  const handleUpdateAmount = (id: string, amount: string) => {
    const prev = entries.find((e) => e.id === id);
    if (!prev) return;
    setEntries((p) => p.map((e) => (e.id === id ? { ...e, amount } : e)));
    startMutation(async () => {
      try {
        await updateSubscriptionAmount(id, amount);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("updateSubscriptionAmount failed", err);
        setEntries((p) =>
          p.map((e) => (e.id === id ? { ...e, amount: prev.amount } : e))
        );
      }
    });
  };

  const confirmDeleteLedger = () => {
    const id = pendingDeleteLedgerId;
    if (!id) return;
    const prev = entries.find((e) => e.id === id);
    setEntries((p) => p.filter((e) => e.id !== id));
    setPendingDeleteLedgerId(null);
    startMutation(async () => {
      try {
        await deleteSubscriptionLedger(id);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("deleteSubscriptionLedger failed", err);
        if (prev) setEntries((p) => [...p, prev]);
      }
    });
  };

  // === import ===
  const handleImport = (templateIds: string[]) => {
    if (templateIds.length === 0) return;
    startMutation(async () => {
      try {
        const added = await importSubscriptionsToMonth(
          templateIds,
          ym.year,
          ym.month
        );
        setEntries((p) => [...p, ...added]);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("importSubscriptionsToMonth failed", err);
      }
    });
  };

  // === template mutations ===
  const handleSubmitTemplate = (d: TemplateDraft) => {
    if (editingTemplate) {
      const id = editingTemplate.id;
      const prev = editingTemplate;
      setTemplates((p) =>
        p.map((t) =>
          t.id === id
            ? {
                ...t,
                name: d.name,
                categoryId: d.categoryId,
                defaultAmount: d.defaultAmount,
                billingCycle: d.billingCycle,
                renewDate: d.renewDate,
                updatedAt: new Date(),
              }
            : t
        )
      );
      setEditingTemplate(null);
      startMutation(async () => {
        try {
          const row = await updateSubscriptionTemplate(id, d);
          setTemplates((p) => p.map((t) => (t.id === id ? row : t)));
        } catch (err) {
          toast.error("บันทึกไม่สำเร็จ");
          console.error("updateSubscriptionTemplate failed", err);
          setTemplates((p) => p.map((t) => (t.id === id ? prev : t)));
        }
      });
      return;
    }

    // create
    const tempId = `tmp-${Date.now()}`;
    const now = new Date();
    const optimistic: SubscriptionTemplate = {
      id: tempId,
      userId: "",
      categoryId: d.categoryId,
      name: d.name,
      defaultAmount: d.defaultAmount,
      billingCycle: d.billingCycle,
      renewDate: d.renewDate,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    setTemplates((p) => [...p, optimistic]);
    startMutation(async () => {
      try {
        const row = await createSubscriptionTemplate(d);
        setTemplates((p) => p.map((t) => (t.id === tempId ? row : t)));
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("createSubscriptionTemplate failed", err);
        setTemplates((p) => p.filter((t) => t.id !== tempId));
      }
    });
  };

  const handleToggleTemplateActive = (id: string) => {
    const target = templates.find((t) => t.id === id);
    if (!target) return;
    const next = !target.active;
    setTemplates((p) =>
      p.map((t) => (t.id === id ? { ...t, active: next } : t))
    );
    startMutation(async () => {
      try {
        await toggleSubscriptionTemplateActive(id, next);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("toggleSubscriptionTemplateActive failed", err);
        setTemplates((p) =>
          p.map((t) => (t.id === id ? { ...t, active: !next } : t))
        );
      }
    });
  };

  const confirmDeleteTemplate = () => {
    const id = pendingDeleteTemplateId;
    if (!id) return;
    const prev = templates.find((t) => t.id === id);
    setTemplates((p) => p.filter((t) => t.id !== id));
    setPendingDeleteTemplateId(null);
    startMutation(async () => {
      try {
        await deleteSubscriptionTemplate(id);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("deleteSubscriptionTemplate failed", err);
        if (prev) setTemplates((p) => [...p, prev]);
      }
    });
  };

  const pendingDeleteTemplate = templates.find(
    (t) => t.id === pendingDeleteTemplateId
  );
  const pendingDeleteLedger = entries.find(
    (e) => e.id === pendingDeleteLedgerId
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">สมาชิก/บริการ</h1>
      </div>

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
            รายการสมัคร
          </TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-4">
          <MonthView
            ym={ym}
            items={entries}
            templatesById={templatesById}
            categories={MOCK_CATEGORIES}
            pendingTemplates={pendingTemplates}
            bannerDismissed={bannerDismissed}
            onPrev={() => navigateMonth(-1)}
            onNext={() => navigateMonth(1)}
            onOpenImport={() => setImportOpen(true)}
            onDismissBanner={() =>
              setDismissedMonths((p) => {
                const next = new Set(p);
                next.add(ymKey(ym.year, ym.month));
                return next;
              })
            }
            onTogglePaid={handleTogglePaid}
            onUpdateAmount={handleUpdateAmount}
            onDelete={(id) => setPendingDeleteLedgerId(id)}
          />
        </TabsContent>

        <TabsContent value="tpl" className="mt-4">
          <TemplateView
            templates={templates}
            categories={MOCK_CATEGORIES}
            onAdd={() => {
              setEditingTemplate(null);
              setTemplateDialogOpen(true);
            }}
            onEdit={(id) => {
              const t = templates.find((x) => x.id === id);
              if (!t) return;
              setEditingTemplate(t);
              setTemplateDialogOpen(true);
            }}
            onToggleActive={handleToggleTemplateActive}
            onDelete={(id) => setPendingDeleteTemplateId(id)}
          />
        </TabsContent>
      </Tabs>

      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={(o) => {
          setTemplateDialogOpen(o);
          if (!o) setEditingTemplate(null);
        }}
        categories={MOCK_CATEGORIES}
        initial={editingTemplate}
        onSubmit={handleSubmitTemplate}
      />

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        ym={ym}
        pendingTemplates={pendingTemplates}
        onSubmit={handleImport}
      />

      <AlertDialog
        open={pendingDeleteTemplateId !== null}
        onOpenChange={(o) => !o && setPendingDeleteTemplateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบบริการ?</AlertDialogTitle>
            <AlertDialogDescription>
              ลบ &quot;{pendingDeleteTemplate?.name}&quot; ออกจากรายการสมัคร
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

      <AlertDialog
        open={pendingDeleteLedgerId !== null}
        onOpenChange={(o) => !o && setPendingDeleteLedgerId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบรายการ?</AlertDialogTitle>
            <AlertDialogDescription>
              ลบ &quot;{pendingDeleteLedger?.name}&quot; ออกจากเดือนนี้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLedger}>
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

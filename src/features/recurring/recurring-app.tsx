"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/format";
import { shiftMonth, ymKey } from "@/lib/month";
import {
  deleteRecurringLedger,
  fetchRecurringEntriesByMonth,
  importRecurringToMonth,
  toggleRecurringPaid,
  updateRecurringAmount,
} from "@/server/actions/recurring-ledger";
import {
  createRecurringTemplate,
  deleteRecurringTemplate,
  toggleRecurringTemplateActive,
  updateRecurringTemplate,
  updateRecurringTemplateDefaultAmount,
} from "@/server/actions/recurring-templates";

import { ImportModal } from "./import-modal";
import { MonthView, type AmountEditRequest } from "./month-view";
import {
  TemplateDialog,
  type RecurringTemplateDraft,
} from "./template-dialog";
import { TemplateView } from "./template-view";
import type {
  Category,
  LedgerEntry,
  RecurringTemplate,
  YearMonth,
} from "./types";

type PendingAmountEdit = AmountEditRequest & { currentAmount: string | null };

export function RecurringApp({
  initialTemplates,
  initialEntries,
  categories,
  ym: initialYm,
}: {
  initialTemplates: RecurringTemplate[];
  initialEntries: LedgerEntry[];
  categories: Category[];
  ym: YearMonth;
}) {
  const [ym, setYm] = useState<YearMonth>(initialYm);
  const [templates, setTemplates] =
    useState<RecurringTemplate[]>(initialTemplates);
  const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
  const [, startMutation] = useTransition();
  const [isMonthLoading, startMonthChange] = useTransition();

  // cache รายเดือน — key = "year-month" · seed ด้วย initial server load
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

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<RecurringTemplate | null>(null);
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
  const [pendingAmountEdit, setPendingAmountEdit] =
    useState<PendingAmountEdit | null>(null);

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
        const rows = await fetchRecurringEntriesByMonth(next.year, next.month);
        monthCacheRef.current.set(key, rows);
        if (
          ymRef.current.year === next.year &&
          ymRef.current.month === next.month
        ) {
          setEntries(rows);
        }
      } catch (err) {
        toast.error("โหลดเดือนไม่สำเร็จ");
        console.error("fetchRecurringEntriesByMonth failed", err);
      }
    });
  };

  const templatesById = useMemo(
    () => new Map(templates.map((t) => [t.id, t])),
    [templates]
  );

  // pending = active templates ที่ยังไม่มี ledger row ในเดือนนี้ (และ yearly ต้องตรงเดือน)
  const pendingTemplates = useMemo(() => {
    const usedSourceIds = new Set(
      entries
        .filter((e) => e.sourceType === "recurring_template")
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
    mutateCurrentMonth((p) =>
      p.map((e) =>
        e.id === id
          ? { ...e, paid: next, paidAt: next ? new Date() : null }
          : e
      )
    );
    startMutation(async () => {
      try {
        await toggleRecurringPaid(id, next);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("toggleRecurringPaid failed", err);
        mutateCurrentMonth((p) =>
          p.map((e) =>
            e.id === id
              ? { ...e, paid: !next, paidAt: !next ? new Date() : null }
              : e
          )
        );
      }
    });
  };

  const commitLedgerAmount = (id: string, nextAmount: string | null) => {
    const prev = entries.find((e) => e.id === id);
    if (!prev) return;
    mutateCurrentMonth((p) =>
      p.map((e) => (e.id === id ? { ...e, amount: nextAmount } : e))
    );
    startMutation(async () => {
      try {
        await updateRecurringAmount(id, nextAmount);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("updateRecurringAmount failed", err);
        mutateCurrentMonth((p) =>
          p.map((e) => (e.id === id ? { ...e, amount: prev.amount } : e))
        );
      }
    });
  };

  const commitTemplateDefaultAmount = (
    id: string,
    nextAmount: string | null
  ) => {
    const target = templates.find((t) => t.id === id);
    if (!target) return;
    const prevAmount = target.defaultAmount;
    setTemplates((p) =>
      p.map((t) => (t.id === id ? { ...t, defaultAmount: nextAmount } : t))
    );
    startMutation(async () => {
      try {
        await updateRecurringTemplateDefaultAmount(id, nextAmount);
      } catch (err) {
        toast.error("อัปเดต template ไม่สำเร็จ");
        console.error("updateRecurringTemplateDefaultAmount failed", err);
        setTemplates((p) =>
          p.map((t) =>
            t.id === id ? { ...t, defaultAmount: prevAmount } : t
          )
        );
      }
    });
  };

  // 3-way confirm: template มียอดตั้งไว้ → ถามก่อนแก้
  // template ไม่มียอด / ไม่มี template → save ทันที
  const handleRequestEditAmount = (req: AmountEditRequest) => {
    const target = entries.find((e) => e.id === req.ledgerId);
    if (!target) return;
    if (!req.templateHasAmount || !req.templateId) {
      commitLedgerAmount(req.ledgerId, req.nextAmount);
      return;
    }
    setPendingAmountEdit({ ...req, currentAmount: target.amount });
  };

  const applyAmountEditMonthOnly = () => {
    if (!pendingAmountEdit) return;
    commitLedgerAmount(pendingAmountEdit.ledgerId, pendingAmountEdit.nextAmount);
    setPendingAmountEdit(null);
  };

  const applyAmountEditAlsoTemplate = () => {
    if (!pendingAmountEdit || !pendingAmountEdit.templateId) return;
    commitLedgerAmount(pendingAmountEdit.ledgerId, pendingAmountEdit.nextAmount);
    commitTemplateDefaultAmount(
      pendingAmountEdit.templateId,
      pendingAmountEdit.nextAmount
    );
    setPendingAmountEdit(null);
  };

  const confirmDeleteLedger = () => {
    const id = pendingDeleteLedgerId;
    if (!id) return;
    const prev = entries.find((e) => e.id === id);
    mutateCurrentMonth((p) => p.filter((e) => e.id !== id));
    setPendingDeleteLedgerId(null);
    startMutation(async () => {
      try {
        await deleteRecurringLedger(id);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("deleteRecurringLedger failed", err);
        if (prev) mutateCurrentMonth((p) => [...p, prev]);
      }
    });
  };

  // === import ===
  const handleImport = (templateIds: string[]) => {
    if (templateIds.length === 0) return;
    startMutation(async () => {
      try {
        const added = await importRecurringToMonth(
          templateIds,
          ym.year,
          ym.month
        );
        mutateCurrentMonth((p) => [...p, ...added]);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("importRecurringToMonth failed", err);
      }
    });
  };

  // === template mutations ===
  const handleSubmitTemplate = (d: RecurringTemplateDraft) => {
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
          const row = await updateRecurringTemplate(id, d);
          setTemplates((p) => p.map((t) => (t.id === id ? row : t)));
        } catch (err) {
          toast.error("บันทึกไม่สำเร็จ");
          console.error("updateRecurringTemplate failed", err);
          setTemplates((p) => p.map((t) => (t.id === id ? prev : t)));
        }
      });
      return;
    }

    // create
    const tempId = `tmp-${Date.now()}`;
    const now = new Date();
    const optimistic: RecurringTemplate = {
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
        const row = await createRecurringTemplate(d);
        setTemplates((p) => p.map((t) => (t.id === tempId ? row : t)));
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("createRecurringTemplate failed", err);
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
        await toggleRecurringTemplateActive(id, next);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("toggleRecurringTemplateActive failed", err);
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
        await deleteRecurringTemplate(id);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("deleteRecurringTemplate failed", err);
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

  const formatAmountLabel = (amount: string | null) =>
    amount === null ? "(ไม่ตั้งยอด)" : formatMoney(amount);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">รายการค่าใช้จ่าย</h1>
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
            รายการเดือนนี้
          </TabsTrigger>
          <TabsTrigger
            value="tpl"
            className="-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!"
          >
            ตั้งค่ารายการประจำ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-4">
          <MonthView
            ym={ym}
            items={entries}
            loading={isMonthLoading}
            templatesById={templatesById}
            categories={categories}
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
            onRequestEditAmount={handleRequestEditAmount}
            onDelete={(id) => setPendingDeleteLedgerId(id)}
          />
        </TabsContent>

        <TabsContent value="tpl" className="mt-4">
          <TemplateView
            templates={templates}
            categories={categories}
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
        categories={categories}
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
            <AlertDialogTitle>ลบรายการประจำ?</AlertDialogTitle>
            <AlertDialogDescription>
              ลบ &quot;{pendingDeleteTemplate?.name}&quot; ออกจากรายการประจำ
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

      <Dialog
        open={pendingAmountEdit !== null}
        onOpenChange={(o) => !o && setPendingAmountEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ยอดเดือนนี้ — อัปเดต template ด้วยมั้ย?</DialogTitle>
            <DialogDescription>
              {pendingAmountEdit
                ? `ยอดเดิม ${formatAmountLabel(pendingAmountEdit.currentAmount)} → ยอดใหม่ ${formatAmountLabel(pendingAmountEdit.nextAmount)}`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
            <Button
              className="w-full"
              onClick={applyAmountEditMonthOnly}
            >
              แก้เฉพาะเดือนนี้
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={applyAmountEditAlsoTemplate}
            >
              อัปเดต template ด้วย
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => setPendingAmountEdit(null)}
            >
              ยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

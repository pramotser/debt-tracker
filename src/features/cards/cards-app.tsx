"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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
  createCreditCardCharge,
  deleteCreditCardCharge,
  toggleCreditCardChargePaid,
  updateCreditCardChargeAmount,
} from "@/server/actions/credit-card-charges";
import {
  createCreditCard,
  deleteCreditCard,
  toggleCreditCardActive,
  updateCreditCard,
} from "@/server/actions/credit-cards";
import {
  toggleInstallmentLedgerPaid,
} from "@/server/actions/credit-card-installments";

import { CardDialog, type CardDraft } from "./card-dialog";
import { CardListView } from "./card-list-view";
import { ChargeDialog, type ChargeDraft } from "./charge-dialog";
import { MOCK_BANKS, MOCK_CATEGORIES } from "./mock";
import { StatementView } from "./statement-view";
import type {
  CreditCard,
  CreditCardInstallment,
  LedgerEntry,
  YearMonth,
} from "./types";

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

export function CardsApp({
  initialCards,
  initialPlans,
  initialEntries,
  ym,
}: {
  initialCards: CreditCard[];
  initialPlans: CreditCardInstallment[];
  initialEntries: LedgerEntry[];
  ym: YearMonth;
}) {
  const router = useRouter();
  const [cards, setCards] = useState<CreditCard[]>(initialCards);
  const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
  const [, startMutation] = useTransition();

  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const navigateMonth = (delta: number) => {
    const next = shiftMonth(ym, delta);
    router.push(`?y=${next.year}&m=${next.month}`);
  };

  // === card mutations ===
  const handleSubmitCard = (d: CardDraft) => {
    if (editingCard) {
      const id = editingCard.id;
      const prev = editingCard;
      setCards((p) =>
        p.map((c) =>
          c.id === id
            ? {
                ...c,
                name: d.name,
                bankId: d.bankId,
                lastFourDigits: d.lastFourDigits,
                statementDate: d.statementDate,
                dueDate: d.dueDate,
                updatedAt: new Date(),
              }
            : c
        )
      );
      setEditingCard(null);
      startMutation(async () => {
        try {
          const row = await updateCreditCard(id, d);
          setCards((p) => p.map((c) => (c.id === id ? row : c)));
        } catch (err) {
          toast.error("บันทึกบัตรไม่สำเร็จ");
          console.error("updateCreditCard failed", err);
          setCards((p) => p.map((c) => (c.id === id ? prev : c)));
        }
      });
      return;
    }
    startMutation(async () => {
      try {
        const row = await createCreditCard(d);
        setCards((p) => [...p, row]);
      } catch (err) {
        toast.error("เพิ่มบัตรไม่สำเร็จ");
        console.error("createCreditCard failed", err);
      }
    });
  };

  const handleToggleCardActive = (id: string) => {
    const target = cards.find((c) => c.id === id);
    if (!target) return;
    const next = !target.active;
    setCards((p) => p.map((c) => (c.id === id ? { ...c, active: next } : c)));
    startMutation(async () => {
      try {
        await toggleCreditCardActive(id, next);
      } catch (err) {
        toast.error("เปลี่ยนสถานะไม่สำเร็จ");
        console.error("toggleCreditCardActive failed", err);
        setCards((p) => p.map((c) => (c.id === id ? { ...c, active: !next } : c)));
      }
    });
  };

  const confirmDeleteCard = () => {
    if (!deletingCardId) return;
    const id = deletingCardId;
    setDeletingCardId(null);
    const prev = cards.find((c) => c.id === id);
    setCards((p) => p.filter((c) => c.id !== id));
    startMutation(async () => {
      try {
        await deleteCreditCard(id);
      } catch (err) {
        toast.error("ลบบัตรไม่สำเร็จ — อาจมีแผนผ่อนผูกอยู่");
        console.error("deleteCreditCard failed", err);
        if (prev) setCards((p) => [...p, prev]);
      }
    });
  };

  // === charge mutations ===
  const handleSubmitCharge = (d: ChargeDraft) => {
    startMutation(async () => {
      try {
        const row = await createCreditCardCharge(d);
        setEntries((p) => [...p, row]);
      } catch (err) {
        toast.error("เพิ่มรายการไม่สำเร็จ");
        console.error("createCreditCardCharge failed", err);
      }
    });
  };

  const handleTogglePaid = (entry: LedgerEntry) => {
    const next = !entry.paid;
    setEntries((p) =>
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
        setEntries((p) =>
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
    setEntries((p) =>
      p.map((e) => (e.id === entry.id ? { ...e, amount } : e))
    );
    startMutation(async () => {
      try {
        await updateCreditCardChargeAmount(entry.id, amount);
      } catch (err) {
        toast.error("บันทึกไม่สำเร็จ");
        console.error("updateCreditCardChargeAmount failed", err);
        setEntries((p) => p.map((e) => (e.id === entry.id ? prev : e)));
      }
    });
  };

  const handleDelete = (entry: LedgerEntry) => {
    if (entry.type !== "CREDIT_CARD") return;
    const prev = entry;
    setEntries((p) => p.filter((e) => e.id !== entry.id));
    startMutation(async () => {
      try {
        await deleteCreditCardCharge(entry.id);
      } catch (err) {
        toast.error("ลบไม่สำเร็จ");
        console.error("deleteCreditCardCharge failed", err);
        setEntries((p) => [...p, prev]);
      }
    });
  };

  const deletingCard = cards.find((c) => c.id === deletingCardId);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">บัตรเครดิต</h1>

      <Tabs defaultValue="statement">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0"
        >
          <TabsTrigger
            value="statement"
            className="-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!"
          >
            รายการชำระบัตรเครดิต
          </TabsTrigger>
          <TabsTrigger
            value="mine"
            className="-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!"
          >
            บัตรของฉัน
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statement" className="mt-4">
          <StatementView
            ym={ym}
            cards={cards}
            plans={initialPlans}
            entries={entries}
            onPrev={() => navigateMonth(-1)}
            onNext={() => navigateMonth(1)}
            onAddCharge={() => setChargeDialogOpen(true)}
            onTogglePaid={handleTogglePaid}
            onUpdateAmount={handleUpdateAmount}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <CardListView
            cards={cards}
            banks={MOCK_BANKS}
            onAdd={() => {
              setEditingCard(null);
              setCardDialogOpen(true);
            }}
            onEdit={(id) => {
              const c = cards.find((x) => x.id === id);
              if (!c) return;
              setEditingCard(c);
              setCardDialogOpen(true);
            }}
            onToggleActive={handleToggleCardActive}
            onDelete={(id) => setDeletingCardId(id)}
          />
        </TabsContent>
      </Tabs>

      <CardDialog
        open={cardDialogOpen}
        onOpenChange={(o) => {
          setCardDialogOpen(o);
          if (!o) setEditingCard(null);
        }}
        banks={MOCK_BANKS}
        initial={editingCard}
        onSubmit={handleSubmitCard}
      />

      <ChargeDialog
        open={chargeDialogOpen}
        onOpenChange={setChargeDialogOpen}
        cards={cards.filter((c) => c.active)}
        categories={MOCK_CATEGORIES}
        ym={ym}
        onSubmit={handleSubmitCharge}
      />

      <AlertDialog
        open={deletingCardId !== null}
        onOpenChange={(o) => !o && setDeletingCardId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบบัตร?</AlertDialogTitle>
            <AlertDialogDescription>
              ลบ &quot;{deletingCard?.name}&quot; — ถ้ามีแผนผ่อนผูกอยู่จะลบไม่ได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCard}>
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

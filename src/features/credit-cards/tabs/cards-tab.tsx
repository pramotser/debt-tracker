"use client";

import { useState, useTransition, type Dispatch, type SetStateAction } from "react";
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
import {
  createCreditCard,
  deleteCreditCard,
  toggleCreditCardActive,
  updateCreditCard,
} from "@/server/actions/credit-cards";

import { BANK_LIST } from "@/lib/banks";

import { CardDialog, type CardDraft } from "../card-dialog";
import { CardFaceGrid } from "../card-face-grid";
import type { Bank, CreditCard } from "../types";

const BANKS: Bank[] = BANK_LIST.map((b) => ({ id: b.id, name: b.label }));

export function CardsTab({
  cards,
  setCards,
}: {
  cards: CreditCard[];
  setCards: Dispatch<SetStateAction<CreditCard[]>>;
}) {
  const [, startMutation] = useTransition();
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const handleSubmit = (d: CardDraft) => {
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
                cardNetwork: d.cardNetwork,
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

  const handleToggleActive = (id: string) => {
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
        setCards((p) =>
          p.map((c) => (c.id === id ? { ...c, active: !next } : c))
        );
      }
    });
  };

  const confirmDelete = () => {
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

  const deletingCard = cards.find((c) => c.id === deletingCardId);

  return (
    <>
      <CardFaceGrid
        cards={cards}
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
        onToggleActive={handleToggleActive}
        onDelete={(id) => setDeletingCardId(id)}
      />

      <CardDialog
        open={cardDialogOpen}
        onOpenChange={(o) => {
          setCardDialogOpen(o);
          if (!o) setEditingCard(null);
        }}
        banks={BANKS}
        initial={editingCard}
        onSubmit={handleSubmit}
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
            <AlertDialogAction onClick={confirmDelete}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

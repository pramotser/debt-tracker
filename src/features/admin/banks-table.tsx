"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Bank } from "@/db/schema";
import { getBankBrand } from "@/lib/banks";
import {
  createBank,
  deleteBank,
  toggleBankActive,
  updateBank,
} from "@/server/actions/banks";

import { BankDialog, type BankDraft } from "./bank-dialog";

type CardCountMap = Record<string, number>;

export function BanksTable({
  initialBanks,
  cardCounts,
}: {
  initialBanks: Bank[];
  cardCounts: CardCountMap;
}) {
  const [banks, setBanks] = useState(initialBanks);
  const [, startMutation] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = (d: BankDraft) => {
    if (editing) {
      const id = editing.id;
      const prev = editing;
      setBanks((p) =>
        p.map((b) =>
          b.id === id
            ? {
                ...b,
                shortName: d.shortName,
                name: d.name,
                sortOrder: d.sortOrder,
                active: d.active,
                updatedAt: new Date(),
              }
            : b
        )
      );
      setEditing(null);
      startMutation(async () => {
        try {
          const row = await updateBank(id, d);
          setBanks((p) => p.map((b) => (b.id === id ? row : b)));
        } catch (err) {
          toast.error("บันทึกธนาคารไม่สำเร็จ");
          console.error("updateBank failed", err);
          setBanks((p) => p.map((b) => (b.id === id ? prev : b)));
        }
      });
      return;
    }
    startMutation(async () => {
      try {
        const row = await createBank(d);
        setBanks((p) => [...p, row].sort(sortBanks));
      } catch (err) {
        toast.error("เพิ่มธนาคารไม่สำเร็จ");
        console.error("createBank failed", err);
      }
    });
  };

  const handleToggle = (id: string) => {
    const target = banks.find((b) => b.id === id);
    if (!target) return;
    const next = !target.active;
    setBanks((p) => p.map((b) => (b.id === id ? { ...b, active: next } : b)));
    startMutation(async () => {
      try {
        await toggleBankActive(id);
      } catch (err) {
        toast.error("เปลี่ยนสถานะไม่สำเร็จ");
        console.error("toggleBankActive failed", err);
        setBanks((p) =>
          p.map((b) => (b.id === id ? { ...b, active: !next } : b))
        );
      }
    });
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    const prev = banks.find((b) => b.id === id);
    setBanks((p) => p.filter((b) => b.id !== id));
    startMutation(async () => {
      try {
        await deleteBank(id);
      } catch (err) {
        toast.error("ลบธนาคารไม่สำเร็จ — อาจมีบัตรใช้งานอยู่");
        console.error("deleteBank failed", err);
        if (prev) setBanks((p) => [...p, prev].sort(sortBanks));
      }
    });
  };

  const deleting = banks.find((b) => b.id === deletingId);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="size-4" />
            เพิ่มธนาคาร
          </Button>
        </div>

        <ul className="flex flex-col gap-2">
          {banks.map((b) => {
            const count = cardCounts[b.id] ?? 0;
            const canDelete = count === 0;
            const brand = getBankBrand(b.id);
            return (
              <li
                key={b.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span
                  className="inline-flex h-7 min-w-12 items-center justify-center rounded-md px-2 text-xs font-semibold"
                  style={{ backgroundColor: brand.bg, color: brand.fg }}
                >
                  {b.shortName}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {b.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {b.id} · {count} บัตรใช้งาน
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={b.active}
                    onCheckedChange={() => handleToggle(b.id)}
                    aria-label={`สลับสถานะ ${b.shortName}`}
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="แก้ไข"
                    onClick={() => {
                      setEditing(b);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  {canDelete ? (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="ลบ"
                      onClick={() => setDeletingId(b.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span
                            aria-label="ลบไม่ได้ — มีบัตรใช้งานอยู่"
                            className="inline-flex size-8 items-center justify-center rounded-md opacity-40"
                          />
                        }
                      >
                        <Trash2 className="size-4" />
                      </TooltipTrigger>
                      <TooltipContent>มีบัตรใช้งานอยู่</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <BankDialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) setEditing(null);
          }}
          initial={editing}
          onSubmit={handleSubmit}
        />

        <AlertDialog
          open={deletingId !== null}
          onOpenChange={(o) => !o && setDeletingId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ลบธนาคาร?</AlertDialogTitle>
              <AlertDialogDescription>
                ลบ &quot;{deleting?.name}&quot; — ลบได้เฉพาะธนาคารที่ไม่มีบัตรใช้งานอยู่
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>ลบ</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

function sortBanks(a: Bank, b: Bank): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.id.localeCompare(b.id);
}

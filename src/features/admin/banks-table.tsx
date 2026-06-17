"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Bank } from "@/db/schema";
import {
  createBank,
  deleteBank,
  toggleBankActive,
  updateBank,
} from "@/server/actions/banks";

import { BankDialog, type BankDraft } from "./bank-dialog";

type CardCountMap = Record<string, number>;
type StatusFilter = "all" | "active" | "inactive";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "active", label: "ใช้งาน" },
  { value: "inactive", label: "ปิดใช้" },
];

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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return banks.filter((b) => {
      if (status === "active" && !b.active) return false;
      if (status === "inactive" && b.active) return false;
      if (!q) return true;
      return (
        b.shortName.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q)
      );
    });
  }, [banks, query, status]);

  const counts = useMemo(
    () => ({
      all: banks.length,
      active: banks.filter((b) => b.active).length,
      inactive: banks.filter((b) => !b.active).length,
    }),
    [banks]
  );

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
                brandBg: d.brandBg,
                brandFg: d.brandFg,
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา ชื่อ หรือชื่อย่อ"
              className="pl-8"
              aria-label="ค้นหาธนาคาร"
            />
          </div>
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

        <div
          className="inline-flex w-full items-center gap-1 rounded-lg bg-muted p-1 text-sm sm:w-fit"
          role="tablist"
          aria-label="กรองตามสถานะ"
        >
          {STATUS_OPTIONS.map((opt) => {
            const selected = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setStatus(opt.value)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1 font-medium transition-colors sm:flex-none",
                  selected
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
                <span className="ml-1.5 text-xs opacity-70">
                  {counts[opt.value]}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            ไม่พบธนาคารที่ตรงกับเงื่อนไข
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((b) => {
              const count = cardCounts[b.id] ?? 0;
              const canDelete = count === 0;
              return (
                <li
                  key={b.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <span
                    className="inline-flex h-7 min-w-12 items-center justify-center rounded-md px-2 text-xs font-semibold"
                    style={{ backgroundColor: b.brandBg, color: b.brandFg }}
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
        )}

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

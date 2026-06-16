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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Category } from "@/db/schema";
import { getCategoryIcon } from "@/lib/categories";
import {
  createCategory,
  deleteCategory,
  toggleCategoryActive,
  updateCategory,
} from "@/server/actions/categories";

import { CategoryDialog, type CategoryDraft } from "./category-dialog";

type UsageMap = Record<string, number>;

export function CategoriesTable({
  initialCategories,
  usage,
}: {
  initialCategories: Category[];
  usage: UsageMap;
}) {
  const [items, setItems] = useState(initialCategories);
  const [, startMutation] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = (d: CategoryDraft) => {
    if (editing) {
      const id = editing.id;
      const prev = editing;
      setItems((p) =>
        p.map((c) =>
          c.id === id
            ? {
                ...c,
                name: d.name,
                icon: d.icon,
                colorBg: d.colorBg,
                colorFg: d.colorFg,
                sortOrder: d.sortOrder,
                active: d.active,
                updatedAt: new Date(),
              }
            : c
        )
      );
      setEditing(null);
      startMutation(async () => {
        try {
          const row = await updateCategory(id, d);
          setItems((p) => p.map((c) => (c.id === id ? row : c)));
        } catch (err) {
          toast.error("บันทึกหมวดหมู่ไม่สำเร็จ");
          console.error("updateCategory failed", err);
          setItems((p) => p.map((c) => (c.id === id ? prev : c)));
        }
      });
      return;
    }
    startMutation(async () => {
      try {
        const row = await createCategory(d);
        setItems((p) => [...p, row].sort(sortCategories));
      } catch (err) {
        toast.error("เพิ่มหมวดหมู่ไม่สำเร็จ");
        console.error("createCategory failed", err);
      }
    });
  };

  const handleToggle = (id: string) => {
    const target = items.find((c) => c.id === id);
    if (!target) return;
    const next = !target.active;
    setItems((p) => p.map((c) => (c.id === id ? { ...c, active: next } : c)));
    startMutation(async () => {
      try {
        await toggleCategoryActive(id);
      } catch (err) {
        toast.error("เปลี่ยนสถานะไม่สำเร็จ");
        console.error("toggleCategoryActive failed", err);
        setItems((p) =>
          p.map((c) => (c.id === id ? { ...c, active: !next } : c))
        );
      }
    });
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    const prev = items.find((c) => c.id === id);
    setItems((p) => p.filter((c) => c.id !== id));
    startMutation(async () => {
      try {
        await deleteCategory(id);
      } catch (err) {
        toast.error("ลบหมวดหมู่ไม่สำเร็จ");
        console.error("deleteCategory failed", err);
        if (prev) setItems((p) => [...p, prev].sort(sortCategories));
      }
    });
  };

  const deleting = items.find((c) => c.id === deletingId);

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
            เพิ่มหมวดหมู่
          </Button>
        </div>

        <ul className="flex flex-col gap-2">
          {items.map((c) => {
            const Icon = getCategoryIcon(c.icon);
            const usageCount = usage[c.id] ?? 0;
            const canDelete = !c.isSystem && usageCount === 0;
            const blockReason = c.isSystem
              ? "หมวดหมู่ระบบ"
              : usageCount > 0
                ? "มีการใช้งานอยู่"
                : null;
            return (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: c.colorBg, color: c.colorFg }}
                >
                  <Icon className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {c.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.id} · {usageCount} รายการใช้งาน
                  </span>
                </div>
                <Badge variant={c.isSystem ? "default" : "secondary"}>
                  {c.isSystem ? "ระบบ" : "กำหนดเอง"}
                </Badge>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={c.active}
                    onCheckedChange={() => handleToggle(c.id)}
                    aria-label={`สลับสถานะ ${c.name}`}
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="แก้ไข"
                    onClick={() => {
                      setEditing(c);
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
                      onClick={() => setDeletingId(c.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span
                            aria-label={`ลบไม่ได้ — ${blockReason}`}
                            className="inline-flex size-8 items-center justify-center rounded-md opacity-40"
                          />
                        }
                      >
                        <Trash2 className="size-4" />
                      </TooltipTrigger>
                      <TooltipContent>{blockReason}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <CategoryDialog
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
              <AlertDialogTitle>ลบหมวดหมู่?</AlertDialogTitle>
              <AlertDialogDescription>
                ลบ &quot;{deleting?.name}&quot; — ลบได้เฉพาะหมวดหมู่ที่ไม่ใช่ระบบและไม่มีการใช้งาน
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

function sortCategories(a: Category, b: Category): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.id.localeCompare(b.id);
}

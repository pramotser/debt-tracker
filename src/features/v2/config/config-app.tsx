"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Bank, CardNetwork, Category } from "@/db/schema-v2";
import { deleteConfigItem, toggleConfigItem } from "@/server/actions/v2/config";
import type { V2Config } from "@/server/queries/v2/config";

import { CategoryIcon } from "./category-icon";
import { BankForm, BankLogo, CategoryForm, NetworkForm } from "./forms";

const tabTriggerClass =
  "-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium whitespace-nowrap text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!";

type Entity = "bank" | "category" | "network";
const LABEL: Record<Entity, string> = {
  bank: "ธนาคาร",
  category: "หมวดหมู่",
  network: "เครือข่ายบัตร",
};

type Editing =
  | { entity: "bank"; row: Bank | null }
  | { entity: "category"; row: Category | null }
  | { entity: "network"; row: CardNetwork | null };

type Deleting = { entity: Entity; id: string; name: string };

export function ConfigApp({ config }: { config: V2Config }) {
  const [tab, setTab] = useState<Entity>("bank");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Deleting | null>(null);
  // เพิ่มทุกครั้งที่เปิดฟอร์ม → ฟอร์ม remount ด้วยค่าใหม่
  const [formKey, setFormKey] = useState(0);
  const [, startTransition] = useTransition();
  const q = query.trim().toLowerCase();

  const banks = useMemo(
    () =>
      config.banks.filter(
        (b) =>
          !q ||
          b.code.includes(q) ||
          b.shortName.toLowerCase().includes(q) ||
          b.nameTh.toLowerCase().includes(q) ||
          (b.nameEn ?? "").toLowerCase().includes(q)
      ),
    [config.banks, q]
  );
  const categories = useMemo(
    () =>
      config.categories.filter(
        (c) =>
          !q ||
          c.code.includes(q) ||
          c.nameTh.toLowerCase().includes(q) ||
          (c.nameEn ?? "").toLowerCase().includes(q)
      ),
    [config.categories, q]
  );
  const networks = useMemo(
    () =>
      config.cardNetworks.filter(
        (n) => !q || n.code.includes(q) || n.name.toLowerCase().includes(q)
      ),
    [config.cardNetworks, q]
  );

  const toggle = (entity: Entity, id: string, next: boolean) =>
    startTransition(async () => {
      const res = await toggleConfigItem(entity, id, next);
      if (!res.ok) toast.error(res.error);
    });

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    startTransition(async () => {
      const res = await deleteConfigItem(target.entity, target.id);
      if (res.ok) toast.success(`ลบ ${target.name} แล้ว`);
      else toast.error(res.error);
    });
  };

  const openForm = (e: Editing) => {
    setFormKey((k) => k + 1);
    setEditing(e);
  };

  const openAdd = () => {
    if (tab === "bank") openForm({ entity: "bank", row: null });
    else if (tab === "category") openForm({ entity: "category", row: null });
    else openForm({ entity: "network", row: null });
  };
  const closeForm = (open: boolean) => !open && setEditing(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อหรือ code"
            className="h-10 rounded-xl pl-9"
            aria-label="ค้นหา"
          />
        </div>
        <Button onClick={openAdd} className="h-10 gap-1.5 rounded-xl">
          <Plus className="size-4" />
          เพิ่ม{LABEL[tab]}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Entity)}>
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-5 overflow-x-auto rounded-none border-b border-border bg-transparent p-0"
        >
          <TabsTrigger value="bank" className={tabTriggerClass}>
            ธนาคาร ({config.banks.length})
          </TabsTrigger>
          <TabsTrigger value="category" className={tabTriggerClass}>
            หมวดหมู่ ({config.categories.length})
          </TabsTrigger>
          <TabsTrigger value="network" className={tabTriggerClass}>
            เครือข่ายบัตร ({config.cardNetworks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="mt-4">
          <ItemList empty={banks.length === 0}>
            {banks.map((b) => (
              <Row
                key={b.id}
                leading={<BankLogo shortName={b.shortName} bg={b.brandBg} fg={b.brandFg} />}
                title={b.nameTh}
                subtitle={[b.code, b.nameEn].filter(Boolean).join(" · ")}
                active={b.isActive}
                onToggle={(v) => toggle("bank", b.id, v)}
                onEdit={() => openForm({ entity: "bank", row: b })}
                onDelete={() => setDeleting({ entity: "bank", id: b.id, name: b.nameTh })}
              />
            ))}
          </ItemList>
        </TabsContent>

        <TabsContent value="category" className="mt-4">
          <ItemList empty={categories.length === 0}>
            {categories.map((c) => (
                <Row
                  key={c.id}
                  leading={
                    <span
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: c.colorBg, color: c.colorFg }}
                    >
                      <CategoryIcon icon={c.icon} className="size-4" />
                    </span>
                  }
                  title={c.nameTh}
                  subtitle={[c.code, c.nameEn].filter(Boolean).join(" · ")}
                  active={c.isActive}
                  onToggle={(v) => toggle("category", c.id, v)}
                  onEdit={() => openForm({ entity: "category", row: c })}
                  onDelete={() =>
                    setDeleting({ entity: "category", id: c.id, name: c.nameTh })
                  }
                />
            ))}
          </ItemList>
        </TabsContent>

        <TabsContent value="network" className="mt-4">
          <ItemList empty={networks.length === 0}>
            {networks.map((n) => (
              <Row
                key={n.id}
                title={n.name}
                subtitle={n.code}
                active={n.isActive}
                onToggle={(v) => toggle("network", n.id, v)}
                onEdit={() => openForm({ entity: "network", row: n })}
                onDelete={() => setDeleting({ entity: "network", id: n.id, name: n.name })}
              />
            ))}
          </ItemList>
        </TabsContent>
      </Tabs>

      <BankForm
        key={`BankForm-${formKey}`}
        open={editing?.entity === "bank"}
        onOpenChange={closeForm}
        initial={editing?.entity === "bank" ? editing.row : null}
      />
      <CategoryForm
        key={`CategoryForm-${formKey}`}
        open={editing?.entity === "category"}
        onOpenChange={closeForm}
        initial={editing?.entity === "category" ? editing.row : null}
      />
      <NetworkForm
        key={`NetworkForm-${formKey}`}
        open={editing?.entity === "network"}
        onOpenChange={closeForm}
        initial={editing?.entity === "network" ? editing.row : null}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ{deleting ? LABEL[deleting.entity] : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              ลบ &quot;{deleting?.name}&quot; ออกถาวร · ถ้าแค่ไม่อยากให้เลือกได้ ให้ปิดสวิตช์ใช้งานแทน
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ItemList({ empty, children }: { empty: boolean; children: ReactNode }) {
  if (empty) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        ไม่พบรายการ
      </div>
    );
  }
  return <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">{children}</ul>;
}

function Row({
  leading,
  title,
  subtitle,
  active,
  onToggle,
  onEdit,
  onDelete,
}: {
  leading?: ReactNode;
  title: string;
  subtitle: string;
  active: boolean;
  onToggle: (next: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      {leading}
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 flex-col text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{title}</span>
          {!active && (
            <Badge variant="outline" className="shrink-0">
              ปิดใช้
            </Badge>
          )}
        </span>
        <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <Switch checked={active} onCheckedChange={onToggle} aria-label={`ใช้งาน ${title}`} />
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`แก้ไข ${title}`}
          onClick={onEdit}
          className="hidden sm:inline-flex"
        >
          <Pencil className="size-4" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label={`ลบ ${title}`} onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </li>
  );
}

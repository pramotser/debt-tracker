"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Bank, CardNetwork, Category } from "@/db/schema-v2";
import { getCategoryIcon } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { V2Config } from "@/server/queries/v2/config";

const tabTriggerClass =
  "-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!";

type TabValue = "banks" | "categories" | "networks";

export function ConfigApp({ config }: { config: V2Config }) {
  const [tab, setTab] = useState<TabValue>("banks");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const banks = useMemo(
    () =>
      config.banks.filter(
        (b) =>
          !q ||
          b.code.includes(q) ||
          b.shortName.toLowerCase().includes(q) ||
          b.nameTh.toLowerCase().includes(q)
      ),
    [config.banks, q]
  );
  const categories = useMemo(
    () =>
      config.categories.filter(
        (c) => !q || c.code.includes(q) || c.nameTh.toLowerCase().includes(q)
      ),
    [config.categories, q]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อหรือ code"
          className="h-10 rounded-xl pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0"
        >
          <TabsTrigger value="banks" className={tabTriggerClass}>
            ธนาคาร ({config.banks.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className={tabTriggerClass}>
            หมวดหมู่ ({config.categories.length})
          </TabsTrigger>
          <TabsTrigger value="networks" className={tabTriggerClass}>
            เครือข่ายบัตร ({config.cardNetworks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banks" className="mt-4">
          <BanksView banks={banks} networks={config.cardNetworks} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesView categories={categories} />
        </TabsContent>
        <TabsContent value="networks" className="mt-4">
          <NetworksView networks={config.cardNetworks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
      ไม่พบรายการที่ค้นหา
    </div>
  );
}

function InactiveBadge({ active }: { active: boolean }) {
  if (active) return null;
  return <Badge variant="outline">ปิดใช้</Badge>;
}

// ---------- ธนาคาร: กดเลือก → ดูตัวอย่างบัตรสีแบรนด์ ----------
function BanksView({
  banks,
  networks,
}: {
  banks: Bank[];
  networks: CardNetwork[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [networkCode, setNetworkCode] = useState<string>(
    networks[0]?.code ?? ""
  );
  const selected = banks.find((b) => b.id === selectedId) ?? banks[0];
  const network = networks.find((n) => n.code === networkCode);

  if (banks.length === 0) return <Empty />;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {selected && (
        <div className="flex flex-col gap-3 sm:sticky sm:top-4 sm:w-72 sm:shrink-0">
          <CardPreview bank={selected} network={network} />
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {networks.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setNetworkCode(n.code)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors",
                  n.code === networkCode
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                {n.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
        {banks.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => setSelectedId(b.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-colors hover:bg-muted/50",
                selected?.id === b.id
                  ? "border-primary ring-1 ring-primary"
                  : "border-border"
              )}
            >
              <span
                className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl px-0.5 text-[9px] leading-none font-bold whitespace-nowrap"
                style={{ backgroundColor: b.brandBg, color: b.brandFg }}
              >
                {b.shortName}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{b.nameTh}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {b.code} · เดิม {b.legacyId ?? "—"}
                </span>
              </span>
              <InactiveBadge active={b.isActive} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CardPreview({
  bank,
  network,
}: {
  bank: Bank;
  network?: CardNetwork;
}) {
  return (
    <div
      className="relative flex aspect-[1.586] w-full flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-sm"
      style={{ backgroundColor: bank.brandBg, color: bank.brandFg }}
    >
      <div
        className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full opacity-15"
        style={{ backgroundColor: bank.brandFg }}
      />
      <div className="flex items-start justify-between">
        <span className="text-sm font-bold">{bank.shortName}</span>
        <span className="text-[10px] opacity-80">ตัวอย่างบัตร</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-base tracking-widest whitespace-nowrap">
          •••• •••• •••• 1234
        </span>
        <div className="flex items-end justify-between gap-2">
          <span className="truncate text-xs opacity-90">{bank.nameTh}</span>
          <span className="shrink-0 text-xs font-semibold italic">
            {network?.name}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------- หมวดหมู่ ----------
function CategoriesView({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return <Empty />;
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => {
        const Icon = getCategoryIcon(c.icon);
        return (
          <li
            key={c.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <span
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: c.colorBg, color: c.colorFg }}
            >
              <Icon className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{c.nameTh}</span>
              <span className="truncate text-xs text-muted-foreground">
                {c.code} · {c.icon}
              </span>
            </span>
            <InactiveBadge active={c.isActive} />
          </li>
        );
      })}
    </ul>
  );
}

// ---------- เครือข่ายบัตร ----------
function NetworksView({ networks }: { networks: CardNetwork[] }) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {networks.map((n) => (
        <li
          key={n.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{n.name}</span>
            <span className="text-xs text-muted-foreground">{n.code}</span>
          </span>
          <InactiveBadge active={n.isActive} />
        </li>
      ))}
    </ul>
  );
}

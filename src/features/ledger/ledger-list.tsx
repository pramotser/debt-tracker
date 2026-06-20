"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type Category, type LedgerEntry } from "@/db/schema";
import { formatMoney, formatYearMonth } from "@/lib/format";
import { fetchMoreLedgerEntries } from "@/server/actions/ledger";
import {
  type LedgerCursor,
  type ListAllLedgerEntriesFilters,
} from "@/server/queries/ledger-entries";

import { LedgerRow } from "./ledger-row";

type Group = { year: number; month: number; items: LedgerEntry[] };

function groupByMonth(entries: LedgerEntry[]): Group[] {
  const out: Group[] = [];
  for (const e of entries) {
    const last = out[out.length - 1];
    if (last && last.year === e.year && last.month === e.month) {
      last.items.push(e);
    } else {
      out.push({ year: e.year, month: e.month, items: [e] });
    }
  }
  return out;
}

function toNumber(value: string | null): number {
  if (value === null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// infinite list — render initialItems · sentinel ที่ก้นโผล่ก็ยิง action
// page key={filter} ฝั่ง parent ทำให้ remount ทุกครั้งที่ filter เปลี่ยน
export function LedgerList({
  filters,
  initialItems,
  initialCursor,
  categories,
}: {
  filters: ListAllLedgerEntriesFilters;
  initialItems: LedgerEntry[];
  initialCursor: LedgerCursor | null;
  categories: Category[];
}) {
  const [items, setItems] = useState<LedgerEntry[]>(initialItems);
  const [cursor, setCursor] = useState<LedgerCursor | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // กัน double-fire ตอน scroll เร็ว ๆ — ref เร็วกว่า state ใน observer callback
  const inflight = useRef(false);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const groups = useMemo(() => groupByMonth(items), [items]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor) return;

    const obs = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || inflight.current) return;
        inflight.current = true;
        setLoading(true);
        setError(null);
        try {
          const page = await fetchMoreLedgerEntries(filters, cursor);
          setItems((prev) => [...prev, ...page.items]);
          setCursor(page.nextCursor);
        } catch (err) {
          setError(err instanceof Error ? err.message : "โหลดเพิ่มไม่ได้");
        } finally {
          setLoading(false);
          inflight.current = false;
        }
      },
      // เริ่มโหลดก่อนถึงก้นจริง 400px → smooth กว่า
      { rootMargin: "400px 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [cursor, filters]);

  if (groups.length === 0) {
    return (
      <Card className="px-6 py-12 text-center text-sm text-muted-foreground">
        ไม่พบรายการตามตัวกรองนี้
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => {
        const gTotal = g.items.reduce((s, e) => s + toNumber(e.amount), 0);
        return (
          <section
            key={`${g.year}-${g.month}`}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
              <h2 className="text-base font-semibold tabular-nums">
                {formatYearMonth(g.year, g.month)}
              </h2>
              <div className="text-xs text-muted-foreground tabular-nums">
                {g.items.length} รายการ · {formatMoney(gTotal)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {g.items.map((e) => (
                <LedgerRow
                  key={e.id}
                  entry={e}
                  category={categoryById.get(e.categoryId)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {cursor && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-4"
          aria-hidden
        >
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              กำลังโหลดเพิ่ม...
            </div>
          ) : (
            <RowSkeletonGroup />
          )}
        </div>
      )}

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error} — เลื่อนขึ้นแล้วลงใหม่เพื่อลองอีกครั้ง
        </Card>
      )}

      {!cursor && items.length >= 50 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          สิ้นสุดรายการ
        </p>
      )}
    </div>
  );
}

function RowSkeletonGroup() {
  return (
    <div className="flex w-full flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card
          key={i}
          className="relative gap-2 overflow-hidden p-0 py-3 pr-3 pl-4 text-sm shadow-sm"
        >
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1 bg-foreground/10"
          />
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <div className="flex gap-1.5">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-7 w-24" />
          </div>
        </Card>
      ))}
    </div>
  );
}

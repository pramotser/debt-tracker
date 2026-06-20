import { Card } from "@/components/ui/card";
import {
  LEDGER_ENTRY_TYPES,
  type LedgerEntryType,
} from "@/db/schema";
import {
  LedgerFilters,
  type LedgerFiltersState,
} from "@/features/ledger/ledger-filters";
import { LedgerList } from "@/features/ledger/ledger-list";
import { formatMoney } from "@/lib/format";
import { getCategories } from "@/server/queries/categories";
import {
  getLedgerSummary,
  listAllLedgerEntries,
  type ListAllLedgerEntriesFilters,
} from "@/server/queries/ledger-entries";

import type { PaidFilter } from "@/features/ledger/types";

const PAGE_SIZE = 50;

function pickStr(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(
  searchParams: Record<string, string | string[] | undefined>
): LedgerFiltersState {
  const now = new Date();
  const yRaw = pickStr(searchParams.y);
  const mRaw = pickStr(searchParams.m);
  const typesRaw = pickStr(searchParams.types);
  const catsRaw = pickStr(searchParams.cats);
  const paidRaw = pickStr(searchParams.paid);
  const qRaw = pickStr(searchParams.q);

  const yParsed = yRaw ? Number(yRaw) : NaN;
  const year =
    Number.isInteger(yParsed) && yParsed >= 1970 && yParsed <= 9999
      ? yParsed
      : now.getFullYear();

  let month: number | null;
  if (mRaw === "all") {
    month = null;
  } else {
    const mParsed = mRaw ? Number(mRaw) : NaN;
    month =
      Number.isInteger(mParsed) && mParsed >= 1 && mParsed <= 12
        ? mParsed
        : now.getMonth() + 1;
  }

  const types = (typesRaw ? typesRaw.split(",") : [])
    .map((s) => s.trim())
    .filter((s): s is LedgerEntryType =>
      (LEDGER_ENTRY_TYPES as readonly string[]).includes(s)
    );

  const categoryIds = (catsRaw ? catsRaw.split(",") : [])
    .map((s) => s.trim())
    .filter(Boolean);

  const paid: PaidFilter =
    paidRaw === "paid" || paidRaw === "due" ? paidRaw : "all";

  return {
    year,
    month,
    types,
    categoryIds,
    paid,
    q: qRaw ?? "",
  };
}

function toQueryFilters(
  state: LedgerFiltersState
): ListAllLedgerEntriesFilters {
  return {
    year: state.year,
    month: state.month,
    types: state.types,
    categoryIds: state.categoryIds,
    paid: state.paid === "all" ? null : state.paid === "paid",
    q: state.q,
  };
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const state = parseFilters(sp);
  const queryFilters = toQueryFilters(state);

  const [firstPage, summary, categories] = await Promise.all([
    listAllLedgerEntries(queryFilters, null, PAGE_SIZE),
    getLedgerSummary(queryFilters),
    getCategories(),
  ]);

  // key force remount LedgerList ตอน filter เปลี่ยน → state ภายในรีเซ็ต
  const listKey = JSON.stringify(queryFilters);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">รายการทั้งหมด</h1>
        <p className="text-sm text-muted-foreground">
          รวมธุรกรรมทุกประเภทในที่เดียว · ดูอย่างเดียว · กดไอคอนลูกศรเพื่อไปแก้ที่ต้นทาง
        </p>
      </div>

      <LedgerFilters state={state} categories={categories} />

      <Card className="gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryStat
            label="ยอดรวม"
            value={formatMoney(summary.totalAmount)}
            hint={`${summary.totalCount} รายการ`}
          />
          <SummaryStat
            label="จ่ายแล้ว"
            value={formatMoney(summary.paidAmount)}
            hint={`${summary.paidCount} รายการ`}
            tone="paid"
          />
          <SummaryStat
            label="ค้างจ่าย"
            value={formatMoney(summary.totalAmount - summary.paidAmount)}
            hint={`${summary.totalCount - summary.paidCount} รายการ`}
            tone="due"
          />
        </div>
      </Card>

      <LedgerList
        key={listKey}
        filters={queryFilters}
        initialItems={firstPage.items}
        initialCursor={firstPage.nextCursor}
        categories={categories}
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "paid" | "due";
}) {
  const toneClass =
    tone === "paid"
      ? "text-emerald-600"
      : tone === "due"
        ? "text-orange-600"
        : "";
  return (
    <div className="rounded-xl border bg-background px-4 py-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

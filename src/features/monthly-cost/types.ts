// UI types ของหน้าค่าใช้จ่ายรายเดือน — re-export จาก Drizzle schema (source of truth)
export type {
  Category,
  FixedCostTemplate,
  NewFixedCostTemplate,
  LedgerEntry,
  NewLedgerEntry,
  LedgerEntryType,
} from "@/db/schema";

export type { YearMonth } from "@/lib/month";

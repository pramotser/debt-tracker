// UI types ของหน้าค่าใช้จ่ายรายเดือน — re-export จาก Drizzle schema (source of truth)
// เก็บเฉพาะ Category / YearMonth ที่ UI ใช้เป็นของตัวเอง (categories ยังไม่มีตาราง)
export type {
  FixedCostTemplate,
  NewFixedCostTemplate,
  LedgerEntry,
  NewLedgerEntry,
  LedgerEntryType,
} from "@/db/schema";

export type Category = {
  id: string;
  name: string;
};

export type YearMonth = {
  year: number;
  month: number;
};

// mock layer — รอบนี้ยังไม่ต่อ DB จริง แต่ใช้ type จาก Drizzle schema เป็น source of truth
// row ทุกตัวจึงมีรูปร่างเดียวกับที่จะได้คืนจาก db.select() ของจริง (Decimal = string, ts = Date)

import type {
  Category,
  FixedCostTemplate,
  LedgerEntry,
  YearMonth,
} from "./types";

// dev user (matches lib/auth.ts dev stub แบบหลวมๆ — uuid-ลูก fake ใช้ผูก mock ฝั่ง client)
export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export const CURRENT_YM: YearMonth = (() => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
})();

// categories ยังไม่มีตาราง → mock เป็น list {id, name} ชื่อไทย
export const MOCK_CATEGORIES: Category[] = [
  { id: "c-loan", name: "เงินกู้" },
  { id: "c-family", name: "ครอบครัว" },
  { id: "c-utility", name: "ค่าน้ำค่าไฟ" },
  { id: "c-other", name: "อื่นๆ" },
];

const NOW = new Date();

const tpl = (
  id: string,
  name: string,
  categoryId: string,
  defaultAmount: string | null
): FixedCostTemplate => ({
  id,
  userId: DEV_USER_ID,
  categoryId,
  name,
  defaultAmount,
  active: true,
  createdAt: NOW,
  updatedAt: NOW,
});

export const MOCK_TEMPLATES: FixedCostTemplate[] = [
  tpl("tpl-home-loan", "Home loan", "c-loan", "7800.00"),
  tpl("tpl-car-loan", "Car Loan", "c-loan", "3878.50"),
  tpl("tpl-dad", "Money for Dad", "c-family", "4000.00"),
  tpl("tpl-electric", "Electricity bill", "c-utility", null),
  tpl("tpl-water", "Water bill", "c-utility", null),
];

const entry = (
  id: string,
  name: string,
  categoryId: string,
  amount: string | null,
  paid: boolean,
  sourceId: string | null
): LedgerEntry => ({
  id,
  userId: DEV_USER_ID,
  categoryId,
  sourceType: sourceId ? "fixed_cost_template" : null,
  sourceId,
  type: sourceId ? "FIXED_COST" : "ONE_TIME_COST",
  name,
  amount,
  principalAmount: null,
  interestAmount: null,
  year: CURRENT_YM.year,
  month: CURRENT_YM.month,
  paid,
  paidAt: paid ? NOW : null,
  note: null,
  createdAt: NOW,
  updatedAt: NOW,
});

export const MOCK_LEDGER_ENTRIES: LedgerEntry[] = [
  entry("le-1", "Home loan", "c-loan", "7800.00", true, "tpl-home-loan"),
  entry("le-2", "Car Loan", "c-loan", "3878.50", false, "tpl-car-loan"),
  entry("le-3", "Money for Dad", "c-family", "4000.00", false, "tpl-dad"),
  entry("le-4", "Electricity bill", "c-utility", null, false, "tpl-electric"),
  entry("le-5", "Water bill", "c-utility", "53.27", true, "tpl-water"),
];

import type { LedgerEntryType } from "@/db/schema";

// label/href map ต่อ type — แชร์ใช้ทั้ง filter + row badge + deep link
export const LEDGER_TYPE_META: Record<
  LedgerEntryType,
  { label: string; basePath: string; badgeClass: string }
> = {
  FIXED_COST: {
    label: "รายจ่ายประจำ",
    basePath: "/recurring",
    badgeClass: "border-blue-300 bg-blue-50 text-blue-700",
  },
  ONE_TIME_COST: {
    label: "ครั้งเดียว",
    basePath: "/recurring",
    badgeClass: "border-gray-300 bg-gray-50 text-gray-700",
  },
  CREDIT_CARD: {
    label: "รูดบัตร",
    basePath: "/credit-cards",
    badgeClass: "border-purple-300 bg-purple-50 text-purple-700",
  },
  CREDIT_CARD_INSTALLMENT: {
    label: "ผ่อนชำระ",
    basePath: "/credit-cards",
    badgeClass: "border-rose-300 bg-rose-50 text-rose-700",
  },
};

export type PaidFilter = "all" | "paid" | "due";

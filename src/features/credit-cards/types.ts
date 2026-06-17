export type {
  Bank,
  Category,
  CreditCard,
  CreditCardInstallment,
  InstallmentStatusDb,
  LedgerEntry,
} from "@/db/schema";

export type { YearMonth } from "@/lib/month";

export type UiStatus =
  | "active"
  | "near-end"
  | "completed"
  | "early-settlement";

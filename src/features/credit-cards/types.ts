export type {
  Category,
  CreditCard,
  CreditCardInstallment,
  InstallmentStatusDb,
  LedgerEntry,
} from "@/db/schema";

export type Bank = {
  id: string;
  name: string;
};

export type { YearMonth } from "@/lib/month";

export type UiStatus =
  | "active"
  | "near-end"
  | "completed"
  | "early-settlement";

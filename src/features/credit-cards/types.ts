export type {
  CreditCard,
  CreditCardInstallment,
  InstallmentStatusDb,
  LedgerEntry,
} from "@/db/schema";

export type Category = {
  id: string;
  name: string;
};

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

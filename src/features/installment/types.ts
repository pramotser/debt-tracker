export type {
  CreditCard,
  CreditCardInstallment,
  LedgerEntry,
  InstallmentStatusDb,
} from "@/db/schema";

export type Category = {
  id: string;
  name: string;
};

export type Bank = {
  id: string;
  name: string;
};

export type UiStatus =
  | "active"
  | "near-end"
  | "completed"
  | "early-settlement";

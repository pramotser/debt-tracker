import { pgEnum } from "drizzle-orm/pg-core";

export const LEDGER_ENTRY_TYPES = [
  "FIXED_COST",
  "SUBSCRIPTION",
  "CREDIT_CARD",
  "CREDIT_CARD_INSTALLMENT",
  "ONE_TIME_COST",
] as const;

export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];

export const ledgerEntryType = pgEnum("ledger_entry_type", LEDGER_ENTRY_TYPES);

export const SUBSCRIPTION_CYCLES = ["monthly", "yearly"] as const;

export type SubscriptionCycle = (typeof SUBSCRIPTION_CYCLES)[number];

export const subscriptionCycle = pgEnum(
  "subscription_cycle",
  SUBSCRIPTION_CYCLES
);

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

// รอบรายการประจำ — monthly = fixed cost / sub รายเดือน · yearly = sub รายปี
export const CYCLE_TYPES = ["monthly", "yearly"] as const;

export type CycleType = (typeof CYCLE_TYPES)[number];

export const cycleType = pgEnum("cycle_type", CYCLE_TYPES);

export const INSTALLMENT_STATUSES = ["active", "early_settled"] as const;

export type InstallmentStatusDb = (typeof INSTALLMENT_STATUSES)[number];

export const installmentStatus = pgEnum(
  "installment_status",
  INSTALLMENT_STATUSES
);

export const USER_ROLES = ["admin", "user"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const userRole = pgEnum("user_role", USER_ROLES);

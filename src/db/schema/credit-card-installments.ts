import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { creditCards } from "./credit-cards";
import { installmentStatus } from "./enums";
import { users } from "./users";

// แผนผ่อน · ledger rows generate ตอน create plan (N rows = total_installments)
// installment_principal / installment_interest = NULL = ยังไม่รู้ split (mode 3)
// status เก็บแค่ active/early_settled · completed + near-end derive ฝั่ง UI
export const creditCardInstallments = pgTable("credit_card_installments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creditCardId: uuid("credit_card_id")
    .notNull()
    .references(() => creditCards.id, { onDelete: "restrict" }),
  categoryId: text("category_id").notNull(),
  name: text("name").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  installmentAmount: numeric("installment_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  installmentPrincipal: numeric("installment_principal", {
    precision: 12,
    scale: 2,
  }),
  installmentInterest: numeric("installment_interest", {
    precision: 12,
    scale: 2,
  }),
  totalInstallments: integer("total_installments").notNull(),
  startYear: integer("start_year").notNull(),
  startMonth: integer("start_month").notNull(),
  hasInterest: boolean("has_interest").notNull().default(false),
  status: installmentStatus("status").notNull().default("active"),
  settlementAmount: numeric("settlement_amount", {
    precision: 12,
    scale: 2,
  }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const creditCardInstallmentSelectSchema = createSelectSchema(
  creditCardInstallments
);
export const creditCardInstallmentInsertSchema = createInsertSchema(
  creditCardInstallments
);

export type CreditCardInstallment =
  typeof creditCardInstallments.$inferSelect;
export type NewCreditCardInstallment =
  typeof creditCardInstallments.$inferInsert;

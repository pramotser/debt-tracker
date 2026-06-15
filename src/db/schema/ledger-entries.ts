import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { ledgerEntryType } from "./enums";
import { users } from "./users";

// ตารางกลางของรายจ่ายจริงทุกประเภท (unified ledger)
// source_type / source_id = อ้างกลับต้นทาง — ค่าที่ใช้: "recurring_template" | "credit_card" | "credit_card_installment" (NULL = manual entry)
// principal_amount / interest_amount = ใช้ตอนเป็นรายการผ่อน
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull(),
    sourceType: text("source_type"),
    sourceId: text("source_id"),
    type: ledgerEntryType("type").notNull(),
    name: text("name").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }),
    principalAmount: numeric("principal_amount", { precision: 12, scale: 2 }),
    interestAmount: numeric("interest_amount", { precision: 12, scale: 2 }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    paid: boolean("paid").notNull().default(false),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ledger_entries_user_ym_type_idx").on(
      t.userId,
      t.year,
      t.month,
      t.type
    ),
    index("ledger_entries_source_idx").on(t.sourceType, t.sourceId),
  ]
);

export const ledgerEntrySelectSchema = createSelectSchema(ledgerEntries);
export const ledgerEntryInsertSchema = createInsertSchema(ledgerEntries);

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;

import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { users } from "./users";

// bank_id ยังเป็น text เพราะ admin banks table จะมาทีหลัง (mock ก่อน)
// last_four_digits เป็น optional — บางคนไม่อยากเก็บ
export const creditCards = pgTable("credit_cards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bankId: text("bank_id").notNull(),
  name: text("name").notNull(),
  lastFourDigits: text("last_four_digits"),
  statementDate: integer("statement_date"),
  dueDate: integer("due_date"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const creditCardSelectSchema = createSelectSchema(creditCards);
export const creditCardInsertSchema = createInsertSchema(creditCards);

export type CreditCard = typeof creditCards.$inferSelect;
export type NewCreditCard = typeof creditCards.$inferInsert;

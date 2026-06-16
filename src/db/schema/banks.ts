import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// admin table — global ไม่ผูก user
// id = slug รูปแบบ "b-<short>" (lower-case) — คงเดิมจาก lib/banks.ts เพื่อไม่กระทบ credit_cards.bank_id
// brandBg / brandFg ยังไม่อยู่ใน schema รอบนี้ — ใช้ lib/banks.ts ต่อ
export const banks = pgTable(
  "banks",
  {
    id: text("id").primaryKey(),
    shortName: text("short_name").notNull(),
    name: text("name").notNull(),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_banks_active_sort").on(t.active, t.sortOrder)]
);

export const bankSelectSchema = createSelectSchema(banks);
export const bankInsertSchema = createInsertSchema(banks);

export type Bank = typeof banks.$inferSelect;
export type NewBank = typeof banks.$inferInsert;

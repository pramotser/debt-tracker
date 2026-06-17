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
// brandBg / brandFg = สี chip ที่ใช้แสดงบนทุก module — admin แก้ผ่าน /banks
export const banks = pgTable(
  "banks",
  {
    id: text("id").primaryKey(),
    shortName: text("short_name").notNull(),
    name: text("name").notNull(),
    brandBg: text("brand_bg").notNull().default("#5F5E5A"),
    brandFg: text("brand_fg").notNull().default("#F1EFE8"),
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

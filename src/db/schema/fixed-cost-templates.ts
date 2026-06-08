import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { users } from "./users";

// category_id อ้างถึงตาราง categories (admin table) — ยังไม่สร้างรอบนี้
// เก็บเป็น text ก่อน (mock ใช้ id ขึ้นต้น "c-") ค่อยเปลี่ยนเป็น uuid + FK ตอนทำ admin
export const fixedCostTemplates = pgTable(
  "fixed_cost_templates",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull(),
    name: text("name").notNull(),
    defaultAmount: numeric("default_amount", { precision: 12, scale: 2 }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("fixed_cost_templates_user_idx").on(t.userId)]
);

export const fixedCostTemplateSelectSchema =
  createSelectSchema(fixedCostTemplates);
export const fixedCostTemplateInsertSchema =
  createInsertSchema(fixedCostTemplates);

export type FixedCostTemplate = typeof fixedCostTemplates.$inferSelect;
export type NewFixedCostTemplate = typeof fixedCostTemplates.$inferInsert;

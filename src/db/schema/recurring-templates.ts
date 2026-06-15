import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { cycleType } from "./enums";
import { users } from "./users";

// ตารางรายการประจำ (ยุบ fixed_cost + subscription เข้าด้วยกัน)
// default_amount = NULL ได้ (กรอกทีหลังแบบค่าไฟ)
// billing_cycle monthly = ทุกเดือน · yearly = เฉพาะเดือนตรงตาม renew_date
export const recurringTemplates = pgTable(
  "recurring_templates",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull(),
    name: text("name").notNull(),
    defaultAmount: numeric("default_amount", { precision: 12, scale: 2 }),
    billingCycle: cycleType("billing_cycle").notNull().default("monthly"),
    renewDate: date("renew_date"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("recurring_templates_user_idx").on(t.userId)]
);

export const recurringTemplateSelectSchema =
  createSelectSchema(recurringTemplates);
export const recurringTemplateInsertSchema =
  createInsertSchema(recurringTemplates);

export type RecurringTemplate = typeof recurringTemplates.$inferSelect;
export type NewRecurringTemplate = typeof recurringTemplates.$inferInsert;

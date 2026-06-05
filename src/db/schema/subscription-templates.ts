import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { subscriptionCycle } from "./enums";
import { users } from "./users";

// template ของบริการ subscription
// renew_date:
//   monthly → ใช้ day-part เป็น "วันตัดเงินของทุกเดือน"
//   yearly  → ใช้ month+day เป็น "วันต่ออายุประจำปี" · banner โผล่เฉพาะเดือนตรง
//   nullable ทั้งคู่ (default = today ตอนสร้าง, ผู้ใช้แก้ได้)
export const subscriptionTemplates = pgTable("subscription_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull(),
  name: text("name").notNull(),
  defaultAmount: numeric("default_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  billingCycle: subscriptionCycle("billing_cycle").notNull(),
  renewDate: date("renew_date"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptionTemplateSelectSchema = createSelectSchema(
  subscriptionTemplates
);
export const subscriptionTemplateInsertSchema = createInsertSchema(
  subscriptionTemplates
);

export type SubscriptionTemplate = typeof subscriptionTemplates.$inferSelect;
export type NewSubscriptionTemplate = typeof subscriptionTemplates.$inferInsert;

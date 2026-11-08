import { boolean, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { v2 } from "./schema";

// v2.card_networks — เครือข่ายบัตร (visa / mastercard / jcb / amex / unionpay)
export const cardNetworks = v2.table("card_networks", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  logoKey: text("logo_key"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cardNetworkSelectSchema = createSelectSchema(cardNetworks);
export const cardNetworkInsertSchema = createInsertSchema(cardNetworks);

export type CardNetwork = typeof cardNetworks.$inferSelect;
export type NewCardNetwork = typeof cardNetworks.$inferInsert;

// ค่าเริ่มต้น — ใช้ร่วมกันระหว่าง migration (SQL) และ seed script
export const CARD_NETWORK_SEED = [
  { code: "visa", name: "Visa", sortOrder: 1 },
  { code: "mastercard", name: "Mastercard", sortOrder: 2 },
  { code: "jcb", name: "JCB", sortOrder: 3 },
  { code: "amex", name: "American Express", sortOrder: 4 },
  { code: "unionpay", name: "UnionPay", sortOrder: 5 },
] as const;

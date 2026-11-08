import {
  boolean,
  index,
  integer,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { v2 } from "./schema";

// v2.banks — ธนาคารกลาง (global, admin จัดการ)
// legacy_id = public.banks.id (เช่น 'b-kbank') ใช้ sync ทางเดียว old → new
export const banks = v2.table(
  "banks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    shortName: text("short_name").notNull(),
    nameTh: text("name_th").notNull(),
    nameEn: text("name_en"),
    brandBg: text("brand_bg").notNull().default("#5F5E5A"),
    brandFg: text("brand_fg").notNull().default("#F1EFE8"),
    logoKey: text("logo_key"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    legacyId: text("legacy_id").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_v2_banks_active_sort").on(t.isActive, t.sortOrder)]
);

export const bankSelectSchema = createSelectSchema(banks);
export const bankInsertSchema = createInsertSchema(banks);

export type Bank = typeof banks.$inferSelect;
export type NewBank = typeof banks.$inferInsert;

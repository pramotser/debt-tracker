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

// v2.categories — หมวดหมู่กลางชุดเดียว (admin จัดการ) · ชั้นเดียว ไม่มี sub-category
// legacy_id = public.categories.id (เช่น 'c-loan')
export const categories = v2.table(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    nameTh: text("name_th").notNull(),
    nameEn: text("name_en"),
    icon: text("icon").notNull(),
    colorBg: text("color_bg").notNull(),
    colorFg: text("color_fg").notNull().default("#FFFFFF"),
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
  (t) => [index("idx_v2_categories_active_sort").on(t.isActive, t.sortOrder)]
);

export const categorySelectSchema = createSelectSchema(categories);
export const categoryInsertSchema = createInsertSchema(categories);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

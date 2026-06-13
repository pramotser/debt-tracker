import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Catalog ของ category — global table แชร์ทุก user
// is_system=true + owner_id=null = catalog ระบบ; owner_id != null = user สร้างเอง (เผื่ออนาคต)
// ⚠️ ledger_entries.category_id / templates.category_id เป็น text เปล่า — ไม่มี FK กลับมาที่นี่ (ตั้งใจ)
export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    colorBg: text("color_bg").notNull(),
    colorFg: text("color_fg").notNull().default("#FFFFFF"),
    ownerId: uuid("owner_id"),
    isSystem: boolean("is_system").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_categories_active_sort").on(t.active, t.sortOrder)]
);

export const categorySelectSchema = createSelectSchema(categories);
export const categoryInsertSchema = createInsertSchema(categories);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

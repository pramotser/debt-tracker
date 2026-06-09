import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { userRole } from "./enums";

// users.id = auth.users.id (Supabase Auth) — FK + trigger sync ทำใน migration (raw SQL)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull().default(""),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull().default(""),
  role: userRole("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userSelectSchema = createSelectSchema(users);
export const userInsertSchema = createInsertSchema(users);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

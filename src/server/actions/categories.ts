"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  categories,
  ledgerEntries,
  recurringTemplates,
  type Category,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const PAGE_PATH = "/categories";

const idSchema = z
  .string()
  .trim()
  .regex(/^c-[a-z0-9-]{1,40}$/, "id ต้องเป็น slug รูปแบบ c-<short>");

const nameSchema = z.string().trim().min(1).max(80);
const iconSchema = z.string().trim().min(1).max(60);
const hexSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "ต้องเป็น #RRGGBB หรือ #RGB");
const sortOrderSchema = z.number().int().min(0).max(9999);

const createSchema = z.object({
  name: nameSchema,
  icon: iconSchema,
  colorBg: hexSchema,
  colorFg: hexSchema,
  sortOrder: sortOrderSchema,
  active: z.boolean(),
});

const updateSchema = createSchema;

async function assertAdmin() {
  const user = await getCurrentUser();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}

function slugFromName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (!cleaned) throw new Error("ชื่อไม่สามารถสร้าง slug ได้");
  return `c-${cleaned}`;
}

function revalidate() {
  // Next.js 16: updateTag (server-action) replaces single-arg revalidateTag
  updateTag("categories-catalog");
  revalidatePath(PAGE_PATH);
}

export async function createCategory(
  input: z.infer<typeof createSchema>
): Promise<Category> {
  await assertAdmin();
  const parsed = createSchema.parse(input);
  const id = slugFromName(parsed.name);
  const [row] = await db
    .insert(categories)
    .values({
      id,
      name: parsed.name,
      icon: parsed.icon,
      colorBg: parsed.colorBg,
      colorFg: parsed.colorFg,
      sortOrder: parsed.sortOrder,
      active: parsed.active,
      isSystem: false,
    })
    .returning();
  revalidate();
  return row;
}

export async function updateCategory(
  id: string,
  input: z.infer<typeof updateSchema>
): Promise<Category> {
  await assertAdmin();
  const parsedId = idSchema.parse(id);
  const parsed = updateSchema.parse(input);
  const [row] = await db
    .update(categories)
    .set({
      name: parsed.name,
      icon: parsed.icon,
      colorBg: parsed.colorBg,
      colorFg: parsed.colorFg,
      sortOrder: parsed.sortOrder,
      active: parsed.active,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, parsedId))
    .returning();
  if (!row) throw new Error("category not found");
  revalidate();
  return row;
}

export async function toggleCategoryActive(id: string): Promise<Category> {
  await assertAdmin();
  const parsedId = idSchema.parse(id);
  const [row] = await db
    .update(categories)
    .set({ active: sql`NOT ${categories.active}`, updatedAt: new Date() })
    .where(eq(categories.id, parsedId))
    .returning();
  if (!row) throw new Error("category not found");
  revalidate();
  return row;
}

export async function deleteCategory(id: string): Promise<void> {
  await assertAdmin();
  const parsedId = idSchema.parse(id);
  const [current] = await db
    .select({ isSystem: categories.isSystem })
    .from(categories)
    .where(eq(categories.id, parsedId))
    .limit(1);
  if (!current) throw new Error("category not found");
  if (current.isSystem) throw new Error("หมวดหมู่ระบบ ลบไม่ได้");

  // กัน delete ตอนมี ledger / template ผูกอยู่
  const [ledger] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.categoryId, parsedId));
  const [tmpl] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(recurringTemplates)
    .where(eq(recurringTemplates.categoryId, parsedId));
  if (Number(ledger?.count ?? 0) + Number(tmpl?.count ?? 0) > 0) {
    throw new Error("หมวดหมู่นี้ถูกใช้อยู่ ลบไม่ได้");
  }

  await db.delete(categories).where(eq(categories.id, parsedId));
  revalidate();
}

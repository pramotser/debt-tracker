import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db } from "@/db";
import {
  categories,
  ledgerEntries,
  recurringTemplates,
  type Category,
} from "@/db/schema";

// catalog ของ category — global ไม่ผูก user → cache แบบไม่มี user key ได้
// ⚠️ pattern นี้ใช้ได้เฉพาะ query ที่ไม่อ่าน getCurrentUser() เท่านั้น
//   ห้ามไป copy ไปใช้กับ query ที่ผสมข้อมูล user — จะเห็นข้ามคนทันที

const CACHE_TAG = "categories-catalog";

// active=true เท่านั้น เรียง sort_order — สำหรับ grid เลือก category
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    return db
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.sortOrder));
  },
  ["categories.active.sorted"],
  { tags: [CACHE_TAG] }
);

// ทุก row (รวม inactive) สำหรับ lookup label/icon ของ entry เก่า
// — ห้าม filter active ที่นี่ ไม่งั้น label ของ entry ที่ใช้ category ถูก disable จะหาย
export const getAllCategories = unstable_cache(
  async (): Promise<Category[]> => {
    return db.select().from(categories);
  },
  ["categories.all"],
  { tags: [CACHE_TAG] }
);

export async function getCategoryMap(): Promise<Map<string, Category>> {
  const rows = await getAllCategories();
  return new Map(rows.map((r) => [r.id, r]));
}

// admin view — รวมทุก active/inactive · ไม่ cache เพราะมี mutation บ่อย
// guard admin ฝั่ง page/action
export async function listCategoriesAdmin(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));
}

// นับ usage ต่อ categoryId (ledger + recurring templates) — กัน delete ตอนมี ref
export async function getCategoryUsageCount(): Promise<Map<string, number>> {
  const [ledgerRows, templateRows] = await Promise.all([
    db
      .select({
        categoryId: ledgerEntries.categoryId,
        count: sql<number>`count(*)::int`,
      })
      .from(ledgerEntries)
      .groupBy(ledgerEntries.categoryId),
    db
      .select({
        categoryId: recurringTemplates.categoryId,
        count: sql<number>`count(*)::int`,
      })
      .from(recurringTemplates)
      .groupBy(recurringTemplates.categoryId),
  ]);
  const map = new Map<string, number>();
  for (const r of ledgerRows) {
    map.set(r.categoryId, (map.get(r.categoryId) ?? 0) + Number(r.count));
  }
  for (const r of templateRows) {
    map.set(r.categoryId, (map.get(r.categoryId) ?? 0) + Number(r.count));
  }
  return map;
}

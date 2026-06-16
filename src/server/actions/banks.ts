"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { banks, creditCards, type Bank } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const PAGE_PATH = "/banks";

const idSchema = z
  .string()
  .trim()
  .regex(/^b-[a-z0-9]{1,40}$/, "id ต้องเป็น slug รูปแบบ b-<short>");

const shortNameSchema = z.string().trim().min(1).max(20);
const nameSchema = z.string().trim().min(1).max(120);
const sortOrderSchema = z.number().int().min(0).max(9999);

const createSchema = z.object({
  shortName: shortNameSchema,
  name: nameSchema,
  sortOrder: sortOrderSchema,
  active: z.boolean(),
});

const updateSchema = createSchema;

async function assertAdmin() {
  const user = await getCurrentUser();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}

function slugFromShort(short: string): string {
  const cleaned = short
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);
  if (!cleaned) throw new Error("shortName ไม่สามารถสร้าง slug ได้");
  return `b-${cleaned}`;
}

function revalidate() {
  revalidatePath(PAGE_PATH);
  revalidatePath("/credit-cards");
}

export async function createBank(
  input: z.infer<typeof createSchema>
): Promise<Bank> {
  await assertAdmin();
  const parsed = createSchema.parse(input);
  const id = slugFromShort(parsed.shortName);
  const [row] = await db
    .insert(banks)
    .values({
      id,
      shortName: parsed.shortName,
      name: parsed.name,
      sortOrder: parsed.sortOrder,
      active: parsed.active,
    })
    .returning();
  revalidate();
  return row;
}

export async function updateBank(
  id: string,
  input: z.infer<typeof updateSchema>
): Promise<Bank> {
  await assertAdmin();
  const parsedId = idSchema.parse(id);
  const parsed = updateSchema.parse(input);
  const [row] = await db
    .update(banks)
    .set({
      shortName: parsed.shortName,
      name: parsed.name,
      sortOrder: parsed.sortOrder,
      active: parsed.active,
      updatedAt: new Date(),
    })
    .where(eq(banks.id, parsedId))
    .returning();
  if (!row) throw new Error("bank not found");
  revalidate();
  return row;
}

export async function toggleBankActive(id: string): Promise<Bank> {
  await assertAdmin();
  const parsedId = idSchema.parse(id);
  const [row] = await db
    .update(banks)
    .set({ active: sql`NOT ${banks.active}`, updatedAt: new Date() })
    .where(eq(banks.id, parsedId))
    .returning();
  if (!row) throw new Error("bank not found");
  revalidate();
  return row;
}

export async function deleteBank(id: string): Promise<void> {
  await assertAdmin();
  const parsedId = idSchema.parse(id);
  const [used] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(creditCards)
    .where(eq(creditCards.bankId, parsedId));
  if (used && Number(used.count) > 0) {
    throw new Error("มีบัตรใช้งานอยู่ ลบไม่ได้");
  }
  await db.delete(banks).where(eq(banks.id, parsedId));
  revalidate();
}

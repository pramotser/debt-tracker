"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { fixedCostTemplates, type FixedCostTemplate } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const PAGE_PATH = "/fix-cost";

// เงิน Decimal(12,2) → string ตรงกับ pg numeric
const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "amount must be a number with up to 2 decimals");

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  categoryId: z.string().trim().min(1),
  defaultAmount: amountSchema.nullable(),
});

const idSchema = z.string().uuid();

export async function createTemplate(
  input: z.infer<typeof createSchema>
): Promise<FixedCostTemplate> {
  const parsed = createSchema.parse(input);
  const user = await getCurrentUser();
  const [row] = await db
    .insert(fixedCostTemplates)
    .values({
      userId: user.id,
      name: parsed.name,
      categoryId: parsed.categoryId,
      defaultAmount: parsed.defaultAmount,
    })
    .returning();
  revalidatePath(PAGE_PATH);
  return row;
}

export async function updateTemplateDefaultAmount(
  id: string,
  amount: string | null
): Promise<FixedCostTemplate> {
  const parsedId = idSchema.parse(id);
  const parsedAmount = amount === null ? null : amountSchema.parse(amount);
  const user = await getCurrentUser();
  const [row] = await db
    .update(fixedCostTemplates)
    .set({ defaultAmount: parsedAmount, updatedAt: new Date() })
    .where(
      and(
        eq(fixedCostTemplates.id, parsedId),
        eq(fixedCostTemplates.userId, user.id)
      )
    )
    .returning();
  if (!row) throw new Error("template not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function toggleTemplateActive(
  id: string,
  active: boolean
): Promise<FixedCostTemplate> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  const [row] = await db
    .update(fixedCostTemplates)
    .set({ active, updatedAt: new Date() })
    .where(
      and(
        eq(fixedCostTemplates.id, parsedId),
        eq(fixedCostTemplates.userId, user.id)
      )
    )
    .returning();
  if (!row) throw new Error("template not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function deleteTemplate(id: string): Promise<void> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  await db
    .delete(fixedCostTemplates)
    .where(
      and(
        eq(fixedCostTemplates.id, parsedId),
        eq(fixedCostTemplates.userId, user.id)
      )
    );
  revalidatePath(PAGE_PATH);
}

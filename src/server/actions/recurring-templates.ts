"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  CYCLE_TYPES,
  recurringTemplates,
  type RecurringTemplate,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const PAGE_PATH = "/recurring";

const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "amount must be a number with up to 2 decimals");

const idSchema = z.string().uuid();
const cycleSchema = z.enum(CYCLE_TYPES);
const renewDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "renew_date must be YYYY-MM-DD")
  .nullable();

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(120),
  categoryId: z.string().trim().min(1),
  defaultAmount: amountSchema.nullable(),
  billingCycle: cycleSchema,
  renewDate: renewDateSchema,
});

export async function createRecurringTemplate(
  input: z.infer<typeof upsertSchema>
): Promise<RecurringTemplate> {
  const parsed = upsertSchema.parse(input);
  const user = await getCurrentUser();
  const [row] = await db
    .insert(recurringTemplates)
    .values({
      userId: user.id,
      categoryId: parsed.categoryId,
      name: parsed.name,
      defaultAmount: parsed.defaultAmount,
      billingCycle: parsed.billingCycle,
      renewDate: parsed.renewDate,
    })
    .returning();
  revalidatePath(PAGE_PATH);
  return row;
}

export async function updateRecurringTemplate(
  id: string,
  input: z.infer<typeof upsertSchema>
): Promise<RecurringTemplate> {
  const parsedId = idSchema.parse(id);
  const parsed = upsertSchema.parse(input);
  const user = await getCurrentUser();
  const [row] = await db
    .update(recurringTemplates)
    .set({
      categoryId: parsed.categoryId,
      name: parsed.name,
      defaultAmount: parsed.defaultAmount,
      billingCycle: parsed.billingCycle,
      renewDate: parsed.renewDate,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(recurringTemplates.id, parsedId),
        eq(recurringTemplates.userId, user.id)
      )
    )
    .returning();
  if (!row) throw new Error("template not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function toggleRecurringTemplateActive(
  id: string,
  active: boolean
): Promise<RecurringTemplate> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  const [row] = await db
    .update(recurringTemplates)
    .set({ active, updatedAt: new Date() })
    .where(
      and(
        eq(recurringTemplates.id, parsedId),
        eq(recurringTemplates.userId, user.id)
      )
    )
    .returning();
  if (!row) throw new Error("template not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function updateRecurringTemplateDefaultAmount(
  id: string,
  defaultAmount: string | null
): Promise<RecurringTemplate> {
  const parsedId = idSchema.parse(id);
  const parsedAmount =
    defaultAmount === null ? null : amountSchema.parse(defaultAmount);
  const user = await getCurrentUser();
  const [row] = await db
    .update(recurringTemplates)
    .set({ defaultAmount: parsedAmount, updatedAt: new Date() })
    .where(
      and(
        eq(recurringTemplates.id, parsedId),
        eq(recurringTemplates.userId, user.id)
      )
    )
    .returning();
  if (!row) throw new Error("template not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function deleteRecurringTemplate(id: string): Promise<void> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  await db
    .delete(recurringTemplates)
    .where(
      and(
        eq(recurringTemplates.id, parsedId),
        eq(recurringTemplates.userId, user.id)
      )
    );
  revalidatePath(PAGE_PATH);
}

"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  SUBSCRIPTION_CYCLES,
  subscriptionTemplates,
  type SubscriptionTemplate,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const PAGE_PATH = "/subscription";

const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "amount must be a number with up to 2 decimals");

const idSchema = z.string().uuid();
const cycleSchema = z.enum(SUBSCRIPTION_CYCLES);
const renewDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "renew_date must be YYYY-MM-DD")
  .nullable();

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(120),
  categoryId: z.string().trim().min(1),
  defaultAmount: amountSchema,
  billingCycle: cycleSchema,
  renewDate: renewDateSchema,
});

export async function createSubscriptionTemplate(
  input: z.infer<typeof upsertSchema>
): Promise<SubscriptionTemplate> {
  const parsed = upsertSchema.parse(input);
  const user = await getCurrentUser();
  const [row] = await db
    .insert(subscriptionTemplates)
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

export async function updateSubscriptionTemplate(
  id: string,
  input: z.infer<typeof upsertSchema>
): Promise<SubscriptionTemplate> {
  const parsedId = idSchema.parse(id);
  const parsed = upsertSchema.parse(input);
  const user = await getCurrentUser();
  const [row] = await db
    .update(subscriptionTemplates)
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
        eq(subscriptionTemplates.id, parsedId),
        eq(subscriptionTemplates.userId, user.id)
      )
    )
    .returning();
  if (!row) throw new Error("template not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function toggleSubscriptionTemplateActive(
  id: string,
  active: boolean
): Promise<SubscriptionTemplate> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  const [row] = await db
    .update(subscriptionTemplates)
    .set({ active, updatedAt: new Date() })
    .where(
      and(
        eq(subscriptionTemplates.id, parsedId),
        eq(subscriptionTemplates.userId, user.id)
      )
    )
    .returning();
  if (!row) throw new Error("template not found");
  revalidatePath(PAGE_PATH);
  return row;
}

export async function deleteSubscriptionTemplate(id: string): Promise<void> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  await db
    .delete(subscriptionTemplates)
    .where(
      and(
        eq(subscriptionTemplates.id, parsedId),
        eq(subscriptionTemplates.userId, user.id)
      )
    );
  revalidatePath(PAGE_PATH);
}

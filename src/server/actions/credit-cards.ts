"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { creditCards, type CreditCard } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const PAGE_PATHS = ["/installment", "/cards"];

const idSchema = z.string().uuid();

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(120),
  bankId: z.string().trim().min(1),
  lastFourDigits: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "4 digits")
    .nullable(),
});

function revalidate() {
  for (const p of PAGE_PATHS) revalidatePath(p);
}

export async function createCreditCard(
  input: z.infer<typeof upsertSchema>
): Promise<CreditCard> {
  const parsed = upsertSchema.parse(input);
  const user = await getCurrentUser();
  const [row] = await db
    .insert(creditCards)
    .values({
      userId: user.id,
      bankId: parsed.bankId,
      name: parsed.name,
      lastFourDigits: parsed.lastFourDigits,
    })
    .returning();
  revalidate();
  return row;
}

export async function toggleCreditCardActive(
  id: string,
  active: boolean
): Promise<CreditCard> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  const [row] = await db
    .update(creditCards)
    .set({ active, updatedAt: new Date() })
    .where(and(eq(creditCards.id, parsedId), eq(creditCards.userId, user.id)))
    .returning();
  if (!row) throw new Error("card not found");
  revalidate();
  return row;
}

export async function deleteCreditCard(id: string): Promise<void> {
  const parsedId = idSchema.parse(id);
  const user = await getCurrentUser();
  await db
    .delete(creditCards)
    .where(and(eq(creditCards.id, parsedId), eq(creditCards.userId, user.id)));
  revalidate();
}

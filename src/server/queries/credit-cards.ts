import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { creditCards, type CreditCard } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function listCreditCards(): Promise<CreditCard[]> {
  const user = await getCurrentUser();
  return db
    .select()
    .from(creditCards)
    .where(eq(creditCards.userId, user.id))
    .orderBy(desc(creditCards.active), asc(creditCards.name));
}

export async function listActiveCreditCards(): Promise<CreditCard[]> {
  const user = await getCurrentUser();
  return db
    .select()
    .from(creditCards)
    .where(and(eq(creditCards.userId, user.id), eq(creditCards.active, true)))
    .orderBy(asc(creditCards.name));
}

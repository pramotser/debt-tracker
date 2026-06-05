import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { fixedCostTemplates, type FixedCostTemplate } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function listTemplates(): Promise<FixedCostTemplate[]> {
  const user = await getCurrentUser();
  return db
    .select()
    .from(fixedCostTemplates)
    .where(eq(fixedCostTemplates.userId, user.id))
    .orderBy(asc(fixedCostTemplates.createdAt));
}

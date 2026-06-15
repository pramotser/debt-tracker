import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  recurringTemplates,
  type RecurringTemplate,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function listRecurringTemplates(): Promise<RecurringTemplate[]> {
  const user = await getCurrentUser();
  return db
    .select()
    .from(recurringTemplates)
    .where(eq(recurringTemplates.userId, user.id))
    .orderBy(desc(recurringTemplates.active), asc(recurringTemplates.name));
}

import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  subscriptionTemplates,
  type SubscriptionTemplate,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function listSubscriptionTemplates(): Promise<
  SubscriptionTemplate[]
> {
  const user = await getCurrentUser();
  return db
    .select()
    .from(subscriptionTemplates)
    .where(eq(subscriptionTemplates.userId, user.id))
    .orderBy(desc(subscriptionTemplates.active), asc(subscriptionTemplates.name));
}

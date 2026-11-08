import "server-only";

import { asc } from "drizzle-orm";

import { db } from "@/db";
import {
  banks,
  cardNetworks,
  categories,
  type Bank,
  type CardNetwork,
  type Category,
} from "@/db/schema-v2";

// v2 config — global (ไม่ผูก user) · guard admin ที่ page
export type V2Config = {
  banks: Bank[];
  categories: Category[];
  cardNetworks: CardNetwork[];
};

export async function getV2Config(): Promise<V2Config> {
  const [b, c, n] = await Promise.all([
    db.select().from(banks).orderBy(asc(banks.sortOrder), asc(banks.code)),
    db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.code)),
    db
      .select()
      .from(cardNetworks)
      .orderBy(asc(cardNetworks.sortOrder), asc(cardNetworks.code)),
  ]);
  return { banks: b, categories: c, cardNetworks: n };
}

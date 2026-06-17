import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { banks, creditCards, type Bank } from "@/db/schema";

// admin catalog — global ไม่ผูก user; แต่ guard admin ใน page/action
export async function listBanks(): Promise<Bank[]> {
  return db
    .select()
    .from(banks)
    .orderBy(asc(banks.sortOrder), asc(banks.id));
}

// active=true เท่านั้น — ใช้ตอนเลือก bank ในฟอร์มบัตร
export async function listActiveBanks(): Promise<Bank[]> {
  return db
    .select()
    .from(banks)
    .where(eq(banks.active, true))
    .orderBy(asc(banks.sortOrder), asc(banks.id));
}

// นับบัตรต่อ bank_id (ทุก user) — ใช้กัน delete ตอนมีบัตรใช้อยู่
export async function getBankCardCount(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      bankId: creditCards.bankId,
      count: sql<number>`count(*)::int`,
    })
    .from(creditCards)
    .groupBy(creditCards.bankId);
  return new Map(rows.map((r) => [r.bankId, Number(r.count)]));
}

// Seed mock ledger_entries — สำหรับเทส pagination + filter หน้า /ledger
//
// รัน (ใส่ --env-file ให้ Node โหลด .env.local ก่อน db import):
//   PATH=/opt/homebrew/opt/node@24/bin:$PATH npx tsx --env-file=.env.local scripts/seed-ledger-mock.ts <user_id>
//   ... <user_id> --clean       # ลบ mock เก่าแล้ว seed ใหม่
//   ... <user_id> --clean-only  # แค่ลบ ไม่ seed
//
// mock rows มี note = 'mock' → cleanup ลบเฉพาะนี้ ไม่แตะของจริง

import { and, eq } from "drizzle-orm";

import { db } from "../src/db";
import {
  categories as categoriesTable,
  creditCards as cardsTable,
  ledgerEntries,
} from "../src/db/schema";

const MOCK_NOTE = "mock";
const TOTAL_ROWS = 250;
const MONTHS_BACK = 11; // กระจาย rows ย้อนหลัง 12 เดือน (รวมเดือนปัจจุบัน)

type Type =
  | "FIXED_COST"
  | "ONE_TIME_COST"
  | "CREDIT_CARD"
  | "CREDIT_CARD_INSTALLMENT";

// น้ำหนักการสุ่มต่อ type — สะท้อนของจริง: FIXED + รูดบัตรเยอะ ผ่อนน้อย
const TYPE_WEIGHTS: { type: Type; weight: number; minAmount: number; maxAmount: number; sourceType: string | null }[] = [
  { type: "FIXED_COST", weight: 35, minAmount: 200, maxAmount: 5000, sourceType: "recurring_template" },
  { type: "ONE_TIME_COST", weight: 20, minAmount: 50, maxAmount: 1500, sourceType: null },
  { type: "CREDIT_CARD", weight: 35, minAmount: 80, maxAmount: 8000, sourceType: "credit_card" },
  { type: "CREDIT_CARD_INSTALLMENT", weight: 10, minAmount: 1500, maxAmount: 6000, sourceType: "credit_card_installment" },
];

const NAMES_FIXED = [
  "ค่าไฟ", "ค่าน้ำ", "ค่าอินเทอร์เน็ต", "ค่าโทรศัพท์", "ค่าเช่าห้อง",
  "Netflix", "Spotify", "iCloud", "Disney+", "YouTube Premium",
];
const NAMES_ONETIME = [
  "ค่าอาหารกลางวัน", "Grab กลับบ้าน", "ค่ายาประจำ", "ของขวัญวันเกิดพี่",
  "ค่าตัดผม", "ค่าซักรีด", "ค่าจอดรถ", "ค่าเข้าโรงพยาบาล",
];
const NAMES_CARD = [
  "Starbucks", "7-Eleven", "Lotus", "Big C", "Shopee",
  "Lazada", "Apple Store", "Uniqlo", "Muji", "Tops",
  "Foodland", "After You", "Coffee Beans",
];
const NAMES_INSTALLMENT = [
  "iPhone 15 Pro", "MacBook Air", "iPad Pro", "Samsung TV",
  "เครื่องซักผ้า LG", "AirPods Max", "Sony PS5", "Bose QC45",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1]!;
}

function randAmount(min: number, max: number): string {
  // round เป็น 10 บาท จะดูสมจริง
  const raw = min + Math.random() * (max - min);
  return (Math.round(raw / 10) * 10).toFixed(2);
}

function nameFor(type: Type): string {
  switch (type) {
    case "FIXED_COST":
      return pick(NAMES_FIXED);
    case "ONE_TIME_COST":
      return pick(NAMES_ONETIME);
    case "CREDIT_CARD":
      return pick(NAMES_CARD);
    case "CREDIT_CARD_INSTALLMENT": {
      const base = pick(NAMES_INSTALLMENT);
      const cur = Math.floor(Math.random() * 8) + 1;
      const total = cur + Math.floor(Math.random() * 5) + 2;
      return `${base} งวด ${cur}/${total}`;
    }
  }
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  let y = year;
  let m = month + delta;
  while (m < 1) { m += 12; y -= 1; }
  while (m > 12) { m -= 12; y += 1; }
  return { year: y, month: m };
}

async function clean(userId: string) {
  const result = await db
    .delete(ledgerEntries)
    .where(and(eq(ledgerEntries.userId, userId), eq(ledgerEntries.note, MOCK_NOTE)));
  console.log(`🧹 cleaned mock rows for user ${userId}`);
  return result;
}

async function seed(userId: string) {
  // verify user exists + load reference data
  const cats = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.active, true));
  if (cats.length === 0) {
    throw new Error("no active categories — seed categories first");
  }
  const userCards = await db
    .select({ id: cardsTable.id })
    .from(cardsTable)
    .where(eq(cardsTable.userId, userId));

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  const rows: (typeof ledgerEntries.$inferInsert)[] = [];
  for (let i = 0; i < TOTAL_ROWS; i++) {
    const def = pickWeighted(TYPE_WEIGHTS);
    // กระจายเดือน: ครึ่งหนึ่งของ rows อยู่ในเดือนปัจจุบัน → เห็น pagination ชัดเมื่อ filter เดือนนี้
    // ที่เหลือสุ่มถอยหลัง 0..MONTHS_BACK เดือน
    const monthsBack = i < TOTAL_ROWS / 2 ? 0 : Math.floor(Math.random() * (MONTHS_BACK + 1));
    const { year, month } = shiftMonth(nowYear, nowMonth, -monthsBack);

    const name = nameFor(def.type);
    const amount = randAmount(def.minAmount, def.maxAmount);
    const paid = Math.random() < 0.55; // 55% จ่ายแล้ว
    const category = pick(cats).id;

    // installment ที่มี principal/interest split
    let principalAmount: string | null = null;
    let interestAmount: string | null = null;
    if (def.type === "CREDIT_CARD_INSTALLMENT" && Math.random() < 0.7) {
      const interest = Math.round(Number(amount) * (0.03 + Math.random() * 0.05));
      const principal = Number(amount) - interest;
      principalAmount = principal.toFixed(2);
      interestAmount = interest.toFixed(2);
    }

    // sourceId — ผ่อนใช้ card id ถ้ามี, อื่นๆ ปล่อย null
    let sourceId: string | null = null;
    if (
      (def.type === "CREDIT_CARD" || def.type === "CREDIT_CARD_INSTALLMENT") &&
      userCards.length > 0
    ) {
      sourceId = pick(userCards).id;
    }

    // สร้าง createdAt ภายในเดือนนั้น ๆ — ให้ cursor sort ทำงานชัด
    const dayOffset = Math.floor(Math.random() * 27);
    const createdAt = new Date(year, month - 1, 1 + dayOffset, Math.floor(Math.random() * 24));

    rows.push({
      userId,
      categoryId: category,
      sourceType: def.sourceType,
      sourceId,
      type: def.type,
      name,
      amount,
      principalAmount,
      interestAmount,
      year,
      month,
      paid,
      paidAt: paid ? createdAt : null,
      note: MOCK_NOTE,
      createdAt,
      updatedAt: createdAt,
    });
  }

  // insert เป็นชุด — postgres-js รับ batch ตรง
  await db.insert(ledgerEntries).values(rows);
  console.log(`✅ seeded ${rows.length} mock rows for user ${userId}`);
  const byMonth = new Map<string, number>();
  for (const r of rows) {
    const k = `${r.year}/${String(r.month).padStart(2, "0")}`;
    byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
  }
  console.log("กระจายต่อเดือน:");
  for (const [k, n] of [...byMonth.entries()].sort().reverse()) {
    console.log(`  ${k}: ${n}`);
  }
}

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("usage: tsx scripts/seed-ledger-mock.ts <user_id> [--clean] [--clean-only]");
    process.exit(1);
  }
  const cleanFlag = process.argv.includes("--clean");
  const cleanOnly = process.argv.includes("--clean-only");

  if (cleanFlag || cleanOnly) {
    await clean(userId);
  }
  if (!cleanOnly) {
    await seed(userId);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ seed failed:", err);
  process.exit(1);
});

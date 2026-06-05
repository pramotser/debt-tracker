// Idempotent seed สำหรับ dev — รันซ้ำได้ ไม่ดูดข้อมูลซ้ำ
// รันด้วย: PATH=...node22.../bin:$PATH npx tsx --env-file=.env.local src/db/seed.ts
// ใช้ DIRECT_URL (5432) สำหรับ script แบบ admin/one-off
//
// ขอบเขตรอบนี้: users (dev-01) + user_settings + fixed_cost_templates ตัวอย่าง
// ไม่ seed ledger_entries (เจ้าของกดทดสอบดึงจาก template เอง)

import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  fixedCostTemplates,
  userSettings,
  users,
  type NewFixedCostTemplate,
} from "./schema";

const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

const TEMPLATES: Omit<NewFixedCostTemplate, "userId" | "id">[] = [
  {
    name: "Home loan",
    categoryId: "c-loan",
    defaultAmount: "7800.00",
    active: true,
  },
  {
    name: "Money for Dad",
    categoryId: "c-family",
    defaultAmount: "4000.00",
    active: true,
  },
  {
    name: "Electricity bill",
    categoryId: "c-utility",
    defaultAmount: null,
    active: true,
  },
  {
    name: "Water bill",
    categoryId: "c-utility",
    defaultAmount: null,
    active: true,
  },
];

async function main() {
  const url = process.env.DIRECT_URL;
  if (!url) throw new Error("DIRECT_URL is not set (expected in .env.local)");

  const client = postgres(url);
  const db = drizzle(client);
  const summary = { users: 0, user_settings: 0, fixed_cost_templates: 0 };

  try {
    // users — fixed UUID ให้ตรงกับ DEV_USER_ID ใน mock เดิม
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, DEV_USER_ID))
      .limit(1);
    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: DEV_USER_ID,
        firstName: "Dev",
        lastName: "User",
      });
      summary.users = 1;
    }

    // user_settings — schema ไม่มี unique(user_id) → เช็คก่อน insert
    const existingSettings = await db
      .select({ id: userSettings.id })
      .from(userSettings)
      .where(eq(userSettings.userId, DEV_USER_ID))
      .limit(1);
    if (existingSettings.length === 0) {
      await db.insert(userSettings).values({
        userId: DEV_USER_ID,
        currency: "THB",
        language: "th",
        theme: "light",
      });
      summary.user_settings = 1;
    }

    // fixed_cost_templates — เช็คซ้ำด้วย (userId, name)
    for (const t of TEMPLATES) {
      const exists = await db
        .select({ id: fixedCostTemplates.id })
        .from(fixedCostTemplates)
        .where(
          and(
            eq(fixedCostTemplates.userId, DEV_USER_ID),
            eq(fixedCostTemplates.name, t.name)
          )
        )
        .limit(1);
      if (exists.length === 0) {
        await db.insert(fixedCostTemplates).values({ ...t, userId: DEV_USER_ID });
        summary.fixed_cost_templates += 1;
      }
    }

    console.log(
      `seed done — inserted: users=${summary.users} user_settings=${summary.user_settings} fixed_cost_templates=${summary.fixed_cost_templates}`
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("seed failed:", e);
  process.exit(1);
});

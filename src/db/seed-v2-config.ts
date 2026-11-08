// v2 Phase 1 seed — copy config จาก public → v2 (idempotent · รันซ้ำได้)
// insert-only: แถวที่มีใน v2 แล้ว (legacy_id ซ้ำ) จะไม่ถูกทับ → แก้ใน /v2/config ได้โดยไม่โดน seed เขียนทับ
// ⚠️ ถ้าลบแถวใน v2 แล้วรัน seed ใหม่ แถวที่มาจากของเดิมจะกลับมา
// รัน: npx tsx --env-file=.env.local src/db/seed-v2-config.ts
// ⚠️ แตะ public แบบ SELECT อย่างเดียว · เขียนเฉพาะ schema v2
// ต้องรัน drizzle-v2/0001_v2_config.sql ก่อน

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  banks as v2Banks,
  cardNetworks,
  categories as v2Categories,
  CARD_NETWORK_SEED,
} from "./schema-v2";

type LegacyBank = {
  id: string;
  short_name: string;
  name: string;
  brand_bg: string;
  brand_fg: string;
  active: boolean;
  sort_order: number;
};

type LegacyCategory = {
  id: string;
  name: string;
  icon: string;
  color_bg: string;
  color_fg: string;
  owner_id: string | null;
  is_system: boolean;
  sort_order: number;
  active: boolean;
};

function bankCode(b: LegacyBank): string {
  const fromShort = b.short_name?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return fromShort || b.id.replace(/^b-/, "");
}

async function main() {
  const url = process.env.DIRECT_URL;
  if (!url) throw new Error("DIRECT_URL is not set (expected in .env.local)");

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  try {
    // ---------- banks ----------
    const legacyBanks = await client<LegacyBank[]>`
      SELECT id, short_name, name, brand_bg, brand_fg, active, sort_order
      FROM public.banks ORDER BY sort_order, id`;

    for (const b of legacyBanks) {
      await db
        .insert(v2Banks)
        .values({
          legacyId: b.id,
          code: bankCode(b),
          shortName: b.short_name,
          nameTh: b.name,
          brandBg: b.brand_bg,
          brandFg: b.brand_fg,
          sortOrder: b.sort_order,
          isActive: b.active,
        })
        .onConflictDoNothing({ target: v2Banks.legacyId });
    }

    // ---------- categories (เฉพาะ catalog ระบบ) ----------
    const legacyCategories = await client<LegacyCategory[]>`
      SELECT id, name, icon, color_bg, color_fg, owner_id, is_system, sort_order, active
      FROM public.categories ORDER BY sort_order, id`;

    const systemCats = legacyCategories.filter(
      (c) => c.is_system && c.owner_id === null
    );
    const skipped = legacyCategories.filter(
      (c) => !(c.is_system && c.owner_id === null)
    );
    for (const c of skipped) {
      console.log(`  skip category ${c.id} (is_system=${c.is_system}, owner_id=${c.owner_id})`);
    }

    for (const c of systemCats) {
      await db
        .insert(v2Categories)
        .values({
          legacyId: c.id,
          code: c.id.replace(/^c-/, ""),
          nameTh: c.name,
          icon: c.icon,
          colorBg: c.color_bg,
          colorFg: c.color_fg,
          sortOrder: c.sort_order,
          isActive: c.active,
        })
        .onConflictDoNothing({ target: v2Categories.legacyId });
    }

    // ---------- card_networks ----------
    for (const n of CARD_NETWORK_SEED) {
      await db
        .insert(cardNetworks)
        .values({ code: n.code, name: n.name, sortOrder: n.sortOrder })
        .onConflictDoNothing({ target: cardNetworks.code });
    }

    // ---------- report ----------
    const [counts] = await client<
      { v2_banks: number; v2_categories: number; v2_networks: number }[]
    >`
      SELECT
        (SELECT count(*)::int FROM v2.banks)         AS v2_banks,
        (SELECT count(*)::int FROM v2.categories)    AS v2_categories,
        (SELECT count(*)::int FROM v2.card_networks) AS v2_networks`;

    console.log(`banks:         public=${legacyBanks.length} → v2=${counts.v2_banks}`);
    console.log(
      `categories:    public(system)=${systemCats.length} (skipped ${skipped.length}) → v2=${counts.v2_categories}`
    );
    console.log(`card_networks: v2=${counts.v2_networks} (expected ${CARD_NETWORK_SEED.length})`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

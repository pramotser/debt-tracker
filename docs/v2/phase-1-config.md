# Debt Tracker v2 · Phase 1: Config tables

> วางไฟล์นี้ที่ `docs/v2/phase-1-config.md` แล้วสั่ง Claude Code ว่า
> "อ่าน docs/v2/phase-1-config.md แล้วทำ Phase 1 ตาม spec"

## เป้าหมาย

สร้าง Postgres schema ใหม่ชื่อ `v2` และตารางกลุ่ม **Config** 3 ตาราง (`v2.banks`, `v2.categories`, `v2.card_networks`)
พร้อม seed ข้อมูลตั้งต้น เพื่อเป็นฐานของ Phase 2 (Account) และ Phase 3 (Transaction)

Phase นี้ **ไม่มีหน้าจอ** ไม่มี server action ไม่มี query ฝั่งแอป มีแค่ schema, migration และ seed

---

## ⛔ กฎเหล็ก: ห้ามแตะของเดิม

ระบบเดิมยังใช้งานจริงจนกว่าจะ terminate ทุกอย่างใน Phase นี้ต้อง **เพิ่มอย่างเดียว**

| ห้าม | รายละเอียด |
|---|---|
| แก้ตารางใน schema `public` | ห้าม `ALTER` / `DROP` / `TRUNCATE` / `INSERT` / `UPDATE` / `DELETE` ตารางเดิมทุกตาราง (อ่าน `SELECT` ได้เพื่อ seed) |
| แก้ไฟล์ schema เดิม | ห้ามแก้อะไรใน `src/db/schema/**` |
| แก้ config/migration เดิม | ห้ามแก้ `drizzle.config.ts` และโฟลเดอร์ `drizzle/**` |
| แก้โค้ดแอปเดิม | ห้ามแก้ `src/app/**`, `src/features/**`, `src/lib/**`, `src/components/**` |
| แก้ seed เดิม | ห้ามแก้ `src/db/seed.ts` |
| รัน drizzle-kit ด้วย config เดิม | ห้ามรัน `drizzle-kit push` / `generate` ด้วย `drizzle.config.ts` ระหว่างทำ Phase นี้ |

Git workflow ตามกฎของโปรเจกต์: ทำบน branch `feat/v2-phase1-config`, Conventional Commits, `tsc` ผ่าน + `npm run dev` ขึ้นก่อน commit, **ห้าม push / เปิด PR จนเจ้าของยืนยัน**, เช็คว่าไม่มี `.env*` หลุด

---

## โครงไฟล์ที่ต้องสร้าง (ไฟล์ใหม่ทั้งหมด)

```
drizzle.v2.config.ts                  ← config แยกสำหรับ v2
drizzle-v2/
  0001_v2_config.sql                  ← migration (เขียนมือ ตาม convention เดิมที่รันใน Supabase SQL Editor)
src/db/schema-v2/
  index.ts                            ← export ทุกตารางของ v2
  schema.ts                           ← export const v2 = pgSchema("v2")
  banks.ts
  categories.ts
  card-networks.ts
src/db/seed-v2-config.ts              ← seed แบบรันซ้ำได้ (idempotent)
docs/v2/phase-1-config.md             ← ไฟล์นี้
```

### `drizzle.v2.config.ts`

เหมือน `drizzle.config.ts` เดิม (โหลด `.env.local`, ใช้ `DIRECT_URL` port 5432) แต่:

```ts
schema: "./src/db/schema-v2",
out: "./drizzle-v2",
dialect: "postgresql",
schemaFilter: ["v2"],   // สำคัญ: ให้ drizzle-kit มองเฉพาะ schema v2 ไม่ไปแตะ public
```

---

## นิยามตาราง

กติการ่วมทุกตาราง:
- `id uuid PK default gen_random_uuid()`
- `created_at` / `updated_at` เป็น `timestamptz NOT NULL default now()`
- เป็นข้อมูลกลาง (global) **ไม่มี `user_id`**, admin เป็นคนจัดการ
- `code` เป็น key ที่อ่านออก ใช้อ้างอิงใน seed / โค้ด ห้ามซ้ำ
- `legacy_id` เก็บ id จากตารางเดิม เพื่อให้สคริปต์ sync ใน Phase 2–3 แปลง FK ได้

### `v2.banks`

| column | type | null | หมายเหตุ |
|---|---|---|---|
| `id` | uuid PK | NOT NULL | |
| `code` | text UNIQUE | NOT NULL | lower-case เช่น `kbank`, `scb`, `ktc` |
| `short_name` | text | NOT NULL | เช่น `KBank` |
| `name_th` | text | NOT NULL | |
| `name_en` | text | NULL | เตรียมไว้สำหรับ EN |
| `brand_bg` | text | NOT NULL | default `#5F5E5A` (เหมือนเดิม) |
| `brand_fg` | text | NOT NULL | default `#F1EFE8` (เหมือนเดิม) |
| `logo_key` | text | NULL | |
| `sort_order` | int | NOT NULL | default 0 |
| `is_active` | boolean | NOT NULL | default true |
| `legacy_id` | text UNIQUE | NULL | `public.banks.id` เช่น `b-kbank` |

index: `(is_active, sort_order)`

### `v2.categories`

ชุดกลางชุดเดียว ชั้นเดียว (ไม่มีหมวดย่อย ไม่มีหมวดของผู้ใช้)

| column | type | null | หมายเหตุ |
|---|---|---|---|
| `id` | uuid PK | NOT NULL | |
| `code` | text UNIQUE | NOT NULL | เช่น `loan`, `utilities` |
| `name_th` | text | NOT NULL | |
| `name_en` | text | NULL | |
| `icon` | text | NOT NULL | ชื่อไอคอนเดิม |
| `color_bg` | text | NOT NULL | |
| `color_fg` | text | NOT NULL | default `#FFFFFF` |
| `sort_order` | int | NOT NULL | default 0 |
| `is_active` | boolean | NOT NULL | default true |
| `legacy_id` | text UNIQUE | NULL | `public.categories.id` เช่น `c-loan` |

index: `(is_active, sort_order)`

### `v2.card_networks`

| column | type | null | หมายเหตุ |
|---|---|---|---|
| `id` | uuid PK | NOT NULL | |
| `code` | text UNIQUE | NOT NULL | ใช้ค่าเดียวกับระบบเดิม: `visa`, `mastercard`, `jcb`, `amex`, `unionpay` |
| `name` | text | NOT NULL | `Visa`, `Mastercard`, `JCB`, `American Express`, `UnionPay` |
| `logo_key` | text | NULL | |
| `sort_order` | int | NOT NULL | default 0 |
| `is_active` | boolean | NOT NULL | default true |

> code ใช้ค่าเดียวกับ `public.credit_cards.card_network` เดิม (คุมด้วย zod enum ใน `src/lib/banks.ts`) เพื่อให้ Phase 2 map ได้ตรงๆ ด้วย `code`

---

## Migration `drizzle-v2/0001_v2_config.sql`

เขียนมือ ตาม convention ของ `drizzle/0006_banks_table.sql` (รันใน Supabase SQL Editor ได้ และรันซ้ำได้)

ต้องมี:
1. `CREATE SCHEMA IF NOT EXISTS v2;`
2. `CREATE TABLE IF NOT EXISTS v2.banks / v2.categories / v2.card_networks` ตามนิยามข้างบน
3. index ตามที่ระบุ
4. **RLS:** `ALTER TABLE v2.<table> ENABLE ROW LEVEL SECURITY;` ทุกตาราง + policy อ่านได้สำหรับ `authenticated`
   ```sql
   CREATE POLICY "read_all" ON v2.banks FOR SELECT TO authenticated USING (true);
   ```
   ไม่ต้องมี policy เขียน (admin เขียนผ่าน server ที่ต่อ DB โดยตรง)
5. seed `v2.card_networks` 5 แถว ด้วย `INSERT ... ON CONFLICT (code) DO NOTHING`

**ต้องเช็ค:** role ที่แอปใช้ต่อ DB (`DATABASE_URL` / `DIRECT_URL`) bypass RLS เหมือนตารางเดิม ถ้าไม่ bypass ให้หยุดแล้วรายงานเจ้าของก่อน ห้ามแก้สิทธิ์ของตารางเดิม

ห้ามมีคำสั่งใดใน migration ที่อ้างถึง schema `public` ยกเว้น `SELECT`

---

## Seed `src/db/seed-v2-config.ts`

รันด้วยวิธีเดียวกับ `src/db/seed.ts` เดิม: `npx tsx --env-file=.env.local src/db/seed-v2-config.ts` (ใช้ `DIRECT_URL`)

ทำงานแบบ **idempotent** รันกี่รอบก็ได้ผลเหมือนเดิม:

1. **banks:** อ่านทุกแถวจาก `public.banks` → upsert เข้า `v2.banks` โดยใช้ `legacy_id = public.banks.id` เป็น key
   - `code` = `lower(short_name)` (ถ้าซ้ำให้ fallback เป็น `legacy_id` ตัด `b-` ออก)
   - `name_th` = `name`, `brand_bg`/`brand_fg`/`sort_order` คัดลอกตรง, `is_active` = `active`
2. **categories:** อ่านจาก `public.categories` **เฉพาะ `is_system = true`** → upsert เข้า `v2.categories` โดยใช้ `legacy_id = public.categories.id`
   - `code` = id เดิมตัด prefix `c-` ออก (เช่น `c-loan` → `loan`)
   - `name_th` = `name`, คัดลอก `icon`, `color_bg`, `color_fg`, `sort_order`, `is_active` = `active`
   - ถ้าเจอแถว `owner_id IS NOT NULL` ให้ข้ามและ log จำนวนออกมา
3. **card_networks:** upsert 5 แถวตามตารางข้างบน โดยใช้ `code` เป็น key
4. ตอนจบ log จำนวนแถวของแต่ละตาราง v2 และจำนวนแถวต้นทางเทียบกัน

ทุกการเขียนต้องเป็น `v2.*` เท่านั้น การอ่านจาก `public.*` ใช้ `SELECT` อย่างเดียว

---

## Acceptance checks (ต้องผ่านทั้งหมดก่อนรายงานว่าเสร็จ)

- [ ] `git diff --stat main` แสดงเฉพาะไฟล์ใหม่ในรายการโครงไฟล์ข้างบน ไม่มีไฟล์เดิมถูกแก้
- [ ] `tsc --noEmit` ผ่าน และ `npm run dev` ขึ้น หน้าเดิมทุกหน้าใช้ได้เหมือนเดิม
- [ ] รัน migration แล้ว `\dt v2.*` เห็น 3 ตาราง และ RLS เปิดอยู่ทุกตาราง
- [ ] รัน seed 2 รอบ จำนวนแถวไม่เพิ่มในรอบที่ 2
- [ ] `SELECT count(*)` ของ `v2.banks` = `public.banks` และ `v2.categories` = `public.categories WHERE is_system`
- [ ] `v2.card_networks` มี 5 แถว
- [ ] ทุกแถวใน `v2.banks` / `v2.categories` มี `legacy_id` ไม่ซ้ำ และ `code` ไม่ซ้ำ
- [ ] จำนวนแถวและ `updated_at` ล่าสุดของ `public.banks` / `public.categories` **เหมือนก่อนเริ่ม** (จดไว้ก่อนรัน)
- [ ] `npx drizzle-kit check --config drizzle.v2.config.ts` ไม่มี error

## รายงานผลถึงเจ้าของ

สรุปสั้นๆ: ไฟล์ที่สร้าง, ผล acceptance checks ทีละข้อ, จำนวนแถวที่ seed, และข้อสังเกต (เช่น category ที่ข้าม หรือ code ที่ fallback) แล้วรอเจ้าของยืนยันก่อน push

## นอกขอบเขต Phase นี้

- ตาราง `user_credit_cards` (Phase 2) และ `recurring_templates` / `installments` / `transactions` ของ v2 (Phase 3)
- หน้าจอ admin จัดการ banks / categories / card_networks ของ v2
- การ sync อัตโนมัติ (Phase นี้ seed ครั้งเดียว รันซ้ำเองได้)

## Update — แก้ config ผ่านหน้าเว็บ (`/v2/config`)
- admin เพิ่ม/แก้/ลบ/เปิด-ปิด ธนาคาร · หมวดหมู่ · เครือข่ายบัตร ได้ที่ `/v2/config` (เขียน schema `v2` เท่านั้น)
- ตั้งแต่ตรงนี้ **v2 เป็นต้นทางของ config เอง** — ไม่ sync จาก public ต่อแล้ว
- `seed-v2-config.ts` เปลี่ยนเป็น insert-only (`ON CONFLICT DO NOTHING`) → รันซ้ำไม่ทับของที่แก้ในเว็บ · แต่แถวที่ลบไปแล้วจะถูกเพิ่มกลับ

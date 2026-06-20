# Ledger — spec (✅ built)

route `/ledger` · **มุมมองรวมธุรกรรมทุกประเภทในที่เดียว** (master view ของ `ledger_entries`)

> สถานะ: ✅ built · read-only v1 + cursor pagination + deep-link · ใช้งานจริงได้แล้ว

## Overview

ทุกหน้าอื่นเป็น "view เฉพาะกลุ่ม" ของตาราง `ledger_entries`:

| หน้า | scope |
|---|---|
| `/recurring` | `FIXED_COST` + `ONE_TIME_COST` (เน้น **จัดการ** template + เช็คเดือนนี้) |
| `/credit-cards` | `CREDIT_CARD` + `CREDIT_CARD_INSTALLMENT` (เน้น **จัดการ** บัตร + แผนผ่อน) |
| `/dashboard` | aggregate (chart/KPI) |
| `/ledger` | **ทุก row ทุก type** + filter + search · cross-module **read-only** |

## User story

ในฐานะ user ฉันอยากเห็น **รายการเงินทุกประเภทในที่เดียว** กรองตามเดือน/ประเภท/หมวด/สถานะจ่าย และค้นด้วยชื่อ เพื่อตรวจสอบว่าเดือนนี้จ่ายอะไรไปบ้างโดยไม่ต้องไล่ทีละหน้า

## Scope (v1 — built)

- ✅ **read-only** · mutation อยู่ที่โมดูลเจ้าของ
- ✅ แต่ละ row มีไอคอน ↗ deep-link ไปต้นทาง (map ด้วย `type` + `?y=&m=`)
- ✅ default = เดือนปัจจุบัน + toggle "ทั้งปี" ได้
- ✅ sort = `year DESC, month DESC, createdAt DESC, id DESC`
- ✅ **infinite scroll** ผ่าน cursor pagination (PAGE_SIZE = 50)

## Features

### Filter bar — [src/features/ledger/ledger-filters.tsx](../../../src/features/ledger/ledger-filters.tsx)
- 🔍 ค้นหาชื่อ — debounce 300ms · ใช้ `name ILIKE %q%`
- 📅 เดือน `[<] YYYY/MM [>]` — ใช้ shared [MonthNav](../../../src/components/layout/month-nav.tsx) · toggle "ทั้งปี" → `YYYY (ทั้งปี)`
- ประเภท — multi-select 4 ค่า · checkbox ใน Popover
- หมวด — multi-select · ค้นในหมวด · checkbox ใน Popover
- สถานะ — Popover: ทั้งหมด / จ่ายแล้ว / ค้างจ่าย
- ล้างตัวกรอง — reset `searchParams` ทั้งหมด
- state ทั้งหมด sync ผ่าน URL `searchParams` → bookmark/share ลิงก์ filter ได้

### Summary card — [src/app/(portal)/ledger/page.tsx](../../../src/app/(portal)/ledger/page.tsx)
- ยอดรวม · จ่ายแล้ว · ค้างจ่าย (ยอด + จำนวน) ตาม filter ปัจจุบัน
- มาจาก `getLedgerSummary()` (aggregate SUM/COUNT) **ไม่ใช่** sum ฝั่ง client → ค่าครบเสมอแม้ pagination ยังโหลดไม่หมด

### List + infinite scroll — [src/features/ledger/ledger-list.tsx](../../../src/features/ledger/ledger-list.tsx)
- หน้าแรก SSR (50 rows) · หน้าต่อ ๆ ไปผ่าน Server Action `fetchMoreLedgerEntries`
- `IntersectionObserver` กับ `rootMargin: "400px 0px"` — โหลดก่อนถึงก้น 400px = smooth ไม่กระตุก
- `inflight` ref กัน double-fire ตอน scroll เร็ว
- group by เดือนเกิดฝั่ง render → page ถัดไปรวมกับ group เดิมได้
- skeleton 3 rows ตอนรอ + error fallback card

### Row card — [src/features/ledger/ledger-row.tsx](../../../src/features/ledger/ledger-row.tsx)
- accent bar (paid=เขียว / due=ส้ม)
- ชื่อ · type badge · category badge
- INSTALLMENT/CC แสดง `เงินต้น X · ดอกเบี้ย Y` ใต้ชื่อถ้ามี
- ขวา: ยอด + StatusBadge + ↗ deep-link

## Type label / deep-link mapping

label/สี/path อยู่ที่ [src/features/ledger/types.ts](../../../src/features/ledger/types.ts) (`LEDGER_TYPE_META`) — แชร์ใช้ทั้ง filter checkbox + row badge

| `type` | badge label | สี | ไปต้นทาง |
|---|---|---|---|
| `FIXED_COST` | รายจ่ายประจำ | น้ำเงิน | `/recurring?y=&m=` |
| `ONE_TIME_COST` | ครั้งเดียว | เทา | `/recurring?y=&m=` |
| `CREDIT_CARD` | รูดบัตร | ม่วง | `/credit-cards?y=&m=` |
| `CREDIT_CARD_INSTALLMENT` | ผ่อนชำระ | กุหลาบ | `/credit-cards?y=&m=` |

> `SUBSCRIPTION` ถูกลบจาก enum (migration `0008_drop_subscription_enum.sql`) เพราะ `/recurring` รวม fixed+sub แล้ว · ไม่มี code path ไหน insert ค่านี้อีก

## Server queries — [src/server/queries/ledger-entries.ts](../../../src/server/queries/ledger-entries.ts)

### `listAllLedgerEntries(filters, cursor?, limit=50)`
ดึงหนึ่งหน้าของ ledger ตาม filter

- `filters`: `{ year, month, types?, categoryIds?, paid?, q? }`
  - `month: null` = ทั้งปี (filter ด้วย year อย่างเดียว)
  - `types[]`/`categoryIds[]` ว่าง = ไม่กรอง
  - `paid: null` = ทั้งหมด
- `cursor`: `{ year, month, createdAt (ISO), id }` หรือ `null` (หน้าแรก)
- return `{ items, nextCursor }` — `nextCursor: null` = หมดแล้ว

**กลไก cursor:** ใช้ Postgres row tuple compare ตรงกับ `orderBy` 4 ตัว · cast ฝั่ง app เพื่อ type ตรง:
```ts
(year, month, createdAt, id) < (?, ?, ?::timestamptz, ?::uuid)
```
ขอ `limit + 1` rows เพื่อรู้ว่ามีหน้าต่อมั้ย

### `getLedgerSummary(filters)`
aggregate รวม + นับ ตาม filter เดียวกัน · return `{ totalAmount, paidAmount, totalCount, paidCount }`

ใช้ `COUNT(*) FILTER (WHERE paid = true)` แยกในเดียว → 1 query

## Server action — [src/server/actions/ledger.ts](../../../src/server/actions/ledger.ts)

`fetchMoreLedgerEntries(filters, cursor, limit?)` — zod validate ทั้ง filters + cursor · `getCurrentUser()` ใน query กัน cross-user

## Page params → state

| URL param | type | default | หมายเหตุ |
|---|---|---|---|
| `y` | number | ปีปัจจุบัน | |
| `m` | number \| `"all"` | เดือนปัจจุบัน | `"all"` = ดูทั้งปี |
| `types` | csv enum | "" (ทั้งหมด) | เช่น `FIXED_COST,CREDIT_CARD` |
| `cats` | csv string | "" (ทั้งหมด) | category ids |
| `paid` | `"paid"` \| `"due"` \| undef | undef (ทั้งหมด) | |
| `q` | string | "" | name search |

filter เปลี่ยน = URL เปลี่ยน = `LedgerList key` เปลี่ยน → remount client (รีเซ็ต items state)

## Nav

- ✅ [sidebar.tsx](../../../src/components/layout/sidebar.tsx) — "รายการทั้งหมด" icon `ScrollText` ใต้ "บัตรเครดิต"
- ✅ [bottom-nav.tsx](../../../src/components/layout/bottom-nav.tsx) — 5 ช่อง (เพิ่ม "ทั้งหมด" ระหว่างบัตร–ตั้งค่า)

## Mock seed

[scripts/seed-ledger-mock.ts](../../../scripts/seed-ledger-mock.ts) — generate 250 rows tag `note='mock'` กระจาย 12 เดือน (ครึ่งหนึ่งอยู่เดือนปัจจุบัน → เห็น pagination ชัด)

```bash
PATH=/opt/homebrew/opt/node@24/bin:$PATH npx tsx --env-file=.env.local scripts/seed-ledger-mock.ts <user_id>
# --clean       seed ซ้ำ ลบ mock เก่าก่อน
# --clean-only  ลบอย่างเดียว
```

## Out of scope (v1)

- แก้/ลบ row ในหน้านี้ (ไปทำที่โมดูลต้นทาง)
- export CSV / PDF
- bulk action (mark paid หลายอัน)
- กราฟ/วิเคราะห์ (อยู่ที่ /dashboard แล้ว)
- toggle ซ่อนงวด installment อนาคต — ใช้ filter เดือนแทนได้

## Decisions made (จาก open questions เดิม)

1. **read-only v1 + deep-link** — ✅
2. **default = เดือนปัจจุบัน + toggle ทั้งปี** — ✅
3. **sort = createdAt DESC** — ✅ (เพิ่ม `id DESC` เป็น tie-breaker ให้ cursor stable)
4. **bottom-nav = 5 ช่อง** — ✅ (เลือกใส่ทั้งบนมือถือเพราะ user ขอเทส)
5. **งวด installment อนาคต** — ✅ แสดงตามปกติ · filter เดือน/ปีจัดการอยู่แล้ว

## Future ideas (v2+)

- export CSV
- bulk mark-paid (ตรวจกฎต่อ type ก่อน)
- "เฉลี่ยต่อเดือน" / "หมวดที่จ่ายเยอะสุด" ใน summary เมื่อ filter = ทั้งปี
- search ขยายไป note field
- ปุ่ม "บันทึก filter" → preset

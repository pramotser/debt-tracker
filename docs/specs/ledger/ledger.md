# Ledger — spec (design · ยังไม่ build)

route `/ledger` · **มุมมองรวมธุรกรรมทุกประเภทในที่เดียว** (master view ของ `ledger_entries`)

> สถานะ: 🚧 stub (`src/app/(portal)/ledger/page.tsx` = placeholder การ์ดเปล่า ยังไม่ต่อ DB)
> ไฟล์นี้ = **design spec** จาก /po · มี open questions ที่เจ้าของต้องเคาะก่อน handoff /sa → /ui → /impl

## Overview

ทุกหน้าอื่นเป็น "view เฉพาะกลุ่ม" ของตาราง `ledger_entries`:
- `/recurring` = `FIXED_COST` + `ONE_TIME_COST`
- `/credit-cards` = `CREDIT_CARD` + `CREDIT_CARD_INSTALLMENT`
- `/dashboard` = aggregate (chart/KPI)

`/ledger` = **ตารางดิบรวมทุก type** พร้อม filter — ใช้ค้นหา/ตรวจสอบ/มองภาพรวมข้ามโมดูล (เช่น "ทุกอย่างในเดือน 2026/03", "ทุกรายการที่ยังไม่จ่าย", "ทุกอย่างหมวดท่องเที่ยวข้าม recurring + บัตร")

## User story

ในฐานะ user ฉันอยากเห็น **รายการเงินทุกประเภทในที่เดียว** กรองตามเดือน/ประเภท/หมวด/สถานะจ่าย และค้นด้วยชื่อ เพื่อตรวจสอบว่าเดือนนี้จ่ายอะไรไปบ้างโดยไม่ต้องไล่ทีละหน้า

## Scope (ข้อเสนอ /po — รอเจ้าของยืนยัน)

**v1 = read-only** — `/ledger` ไม่แก้/ลบ row (mutation อยู่ที่โมดูลเจ้าของ เพราะแต่ละ type มีกฎต่างกัน: installment split, settle ก่อนกำหนด, 3-way amount edit ฯลฯ) · แต่ละ row มีปุ่ม **"ไปที่ต้นทาง"** deep-link ไปหน้าที่แก้ได้จริง (map ด้วย `type` + `?y=&m=`)

> เหตุผล: ทำ read-only ก่อน = value สูง (ค้นหา/audit) + effort ต่ำ + ไม่เสี่ยงทำ mutation ข้าม type ผิดกฎ · editable ค่อยพิจารณา v2

## Acceptance criteria

- [ ] แสดง `ledger_entries` ของ user ครบทุก type ในมุมมองเดียว
- [ ] Filter: ช่วงเดือน (default = เดือนปัจจุบัน) · type (multi) · หมวดหมู่ (multi) · สถานะจ่าย (ทั้งหมด/จ่ายแล้ว/ค้าง) · ค้นหาชื่อ (text)
- [ ] Summary แถวบน: ยอดรวม / จ่ายแล้ว / ค้างจ่าย (ตาม filter ปัจจุบัน)
- [ ] แต่ละ row: ชื่อ · type badge · หมวดหมู่ badge · `YYYY/MM` · ยอด (`formatMoney`) · สถานะ (paid/due) · ปุ่มไปต้นทาง
- [ ] รายการผ่อน (`CREDIT_CARD_INSTALLMENT`) แสดง principal/interest ได้ (ถ้ามี)
- [ ] empty state เมื่อ filter ไม่เจอ
- [ ] mobile: stack การ์ดต่อ row (ห้ามตารางล้นจอ · ยอดเงินห้าม wrap)
- [ ] เพิ่ม `/ledger` เข้า nav (ดู §nav ด้านล่าง)

## UI sketch

```
รายการทั้งหมด
[ 🔍 ค้นหาชื่อ ]  [เดือน: 2026/06 ▾ – ทั้งปี]  [ประเภท ▾]  [หมวด ▾]  [สถานะ ▾]
┌──────────────────────────────────────────────────────────┐
│  ยอดรวม ฿X,XXX   จ่ายแล้ว ฿X (N)   ค้างจ่าย ฿X (N)          │
├──────────────────────────────────────────────────────────┤
│  2026/06                                                   │
│  ค่าไฟ            [รายจ่ายประจำ] [บ้าน]   ฿800   ค้าง  ↗   │
│  Netflix          [รายจ่ายประจำ] [บันเทิง] ฿349   จ่ายแล้ว ↗ │
│  iPhone งวด 3/10  [ผ่อนชำระ]    [มือถือ]  ฿2,500 ค้าง  ↗   │
│  ร้านกาแฟ         [รูดบัตร]     [อาหาร]   ฿120   จ่ายแล้ว ↗ │
└──────────────────────────────────────────────────────────┘
```

> group by เดือน (เมื่อ filter เป็นช่วงหลายเดือน) · ภายในเดือนเรียง `createdAt` หรือ amount (เคาะใน open questions)

## Type label / deep-link mapping

| `type` | badge label | ไปต้นทาง |
|---|---|---|
| `FIXED_COST` | รายจ่ายประจำ | `/recurring?y=&m=` |
| `SUBSCRIPTION` | สมาชิก/บริการ | `/recurring?y=&m=` (legacy data) |
| `ONE_TIME_COST` | ครั้งเดียว | `/recurring?y=&m=` |
| `CREDIT_CARD` | รูดบัตร | `/credit-cards?y=&m=` |
| `CREDIT_CARD_INSTALLMENT` | ผ่อนชำระ | `/credit-cards?y=&m=` |

## Data dependency

- **มีอยู่แล้ว:** `ledger_entries` (ทุก column ที่ต้องใช้ครบ · index `(userId, year, month, type)` รองรับ filter เดือน+type) · `categories` (label/สี) · `credit_cards` + `banks` (label row บัตร — optional v1)
- **ต้องเพิ่ม:** query ใหม่ `listAllLedgerEntries(filters)` ใน `server/queries/ledger-entries.ts` (filter userId + year/month range + type[] + category[] + paid + name ILIKE)
- **ไม่ต้องแตะ schema** — read-only v1 ใช้ของเดิมทั้งหมด

## Nav (สำคัญ — ตอนนี้ orphan)

⚠️ `/ledger` **ไม่อยู่ใน `sidebar.tsx` และ `bottom-nav.tsx`** — เข้าได้แค่พิมพ์ URL ตรง ๆ · ตอน build ต้องเพิ่มลิงก์:
- sidebar: ใต้ "บัตรเครดิต" (icon แนะนำ `ReceiptText` / `ScrollText`)
- bottom-nav: มี 4 ช่องแล้ว (หน้าหลัก/รายการ/บัตร/ตั้งค่า) → ถ้าจะเพิ่มที่ 5 ต้องเช็ค layout มือถือ (เคาะใน open questions)

## Out of scope (v1)

- แก้/ลบ row ในหน้านี้ (ไปทำที่โมดูลต้นทาง)
- export CSV / PDF
- bulk action (mark paid หลายอัน)
- กราฟ/วิเคราะห์ (อยู่ที่ /dashboard แล้ว)

## Open questions (เจ้าของเคาะก่อน /sa)

1. **read-only v1 ใช่ไหม?** (ข้อเสนอ: ใช่ + deep-link) หรืออยากแก้ paid/amount inline ได้เลย?
2. **ช่วงเวลา default** — เดือนปัจจุบัน, ทั้งปี, หรือ "ล่าสุด N รายการ" + infinite scroll? (ข้อเสนอ: เดือนปัจจุบัน + เลือกช่วงได้)
3. **เรียงลำดับ** — ตามวันที่สร้าง, ยอดมาก→น้อย, หรือ paid ก่อน? (ข้อเสนอ: createdAt ใหม่→เก่า ใน group เดือน)
4. **bottom-nav ช่องที่ 5** — ยอมให้มือถือมี 5 ช่อง หรือ /ledger เป็น desktop-sidebar เท่านั้น?
5. **รวม row ผ่อนทุกงวดในอนาคต** — `ledger_entries` materialize ทุกงวดตั้งแต่สร้างแผน → /ledger จะเห็นงวดเดือนหน้า ๆ ด้วย · ต้องการให้แสดงหรือซ่อนงวดอนาคต?

## Handoff (เมื่อเจ้าของเคาะ open questions)

- **/sa** — ออกแบบ shape ของ `listAllLedgerEntries(filters)` + กลยุทธ์ join label (categories/cards) ฝั่ง query vs ฝั่ง app
- **/ui** — wireframe filter bar + row card (mobile-first) ตาม sketch
- **/impl** — query + page + filter client component + เพิ่ม nav link

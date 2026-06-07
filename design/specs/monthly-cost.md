# Spec: ค่าใช้จ่ายรายเดือน — v1

หน้าแรกของจริง · route `/monthly-cost`
รอบนี้ **mock data ตาม shape ของ Drizzle schema** (ยังไม่ต่อ DB จริง — ทุกอย่างเก็บใน client state)
**ไม่มี concept "ปิดรอบ" / "ล็อกเดือน"** — ทุก action เขียนตรงลง row ทันที

## โครงข้อมูล (Drizzle schema = source of truth)

```ts
// src/db/schema/enums.ts
type LedgerEntryType =
  | "FIXED_COST"
  | "SUBSCRIPTION"
  | "CREDIT_CARD"
  | "CREDIT_CARD_INSTALLMENT"
  | "ONE_TIME_COST";

// fixed_cost_templates — รายการจ่ายประจำ (ยังไม่ถูกดึงลงเดือนไหน)
type FixedCostTemplate = {
  id: string;            // uuid
  userId: string;
  categoryId: string;    // text (ยังไม่มีตาราง categories — mock เป็น list {id,name})
  name: string;
  defaultAmount: string | null;  // numeric(12,2) — null = "กรอกเอง"
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ledger_entries — รายจ่ายจริง (unified ledger ของทุก type)
type LedgerEntry = {
  id: string;
  userId: string;
  categoryId: string;
  sourceType: string | null;     // เช่น "fixed_cost_template"
  sourceId: string | null;       // เช่น template.id ที่ถูกดึง
  type: LedgerEntryType;
  name: string;
  amount: string | null;         // numeric(12,2) — null = "แตะเพื่อกรอก"
  principalAmount: string | null;
  interestAmount: string | null;
  year: number;                  // 4-digit
  month: number;                 // 1-12
  paid: boolean;
  paidAt: Date | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

- เงิน: เก็บเป็น **Decimal string** (เลียนแบบ `numeric(12,2)` ที่ pg-driver คืน) — แสดงผ่าน `formatMoney` เสมอ (รับได้ทั้ง string/number)
- เดือน: `year` + `month` (1-12), แสดง `formatYearMonth` = `YYYY/MM`, เรียงด้วย `year*100+month`
- ทุก query/mutation ต้องผูกกับ `userId` จาก `getCurrentUser()` (mock = `DEV_USER_ID`)
- mock categories: `[เงินกู้ / ครอบครัว / ค่าน้ำค่าไฟ / อื่นๆ]` (id+name เท่านั้น — ยังไม่มี table)

## หัวข้อ + 2 tabs

- หัวข้อหน้า: **"ค่าใช้จ่ายรายเดือน"**
- Tab 1: **"รายการจ่ายรายเดือน"**
- Tab 2: **"Template รายการจ่ายประจำ"**

### Tab 1 — รายการจ่ายรายเดือน
อ่านจาก `ledger_entries` filter `userId + year + month` ของเดือนที่เลือก

- **Month nav** บนสุด: ‹ / `YYYY/MM` / › — เปลี่ยนได้ทั้งอดีต/อนาคต **ไม่มี disabled**
- **Summary แนวนอน** (Card แถวเดียว):
  - ยอดรวม · จ่ายแล้ว (เขียว) · ค้างจ่าย (ส้ม) · `paidCount / total` รายการ
- **รายการแบบการ์ด** ต่อ entry:
  - Checkbox จ่ายแล้ว → set `paid` + `paidAt` (`new Date()` ตอนติ๊ก, `null` ตอนเอาออก) · UI **ขีดฆ่า + opacity-60**
  - ชื่อ + CategoryBadge (label = ชื่อหมวดไทย) + badge "กรอกเอง" ถ้า `amount === null`
  - จำนวนเงิน: **แตะที่ตัวเลขเพื่อแก้ inline** → blur/Enter = save (เก็บเป็น Decimal string `n.toFixed(2)`), Esc = cancel; ว่าง = `null`
  - ปุ่ม ลบ (Trash icon) → ลบ entry ทันที (ไม่มี confirm)
- **ปุ่ม "ดึงจาก template"**:
  - ดึงเฉพาะ template ที่ `active === true`
  - insert `ledger_entries` ใหม่: `type='FIXED_COST'`, `sourceType='fixed_cost_template'`, `sourceId=template.id`, `amount=template.defaultAmount`, `paid=false`, `paidAt=null`
  - ถ้ามี entry ในเดือนนั้นชื่อซ้ำ (normalize = `trim().toLocaleLowerCase('th')`) → **AlertDialog confirm "แทนที่"** บอกจำนวนซ้ำ + จำนวนใหม่ที่จะเพิ่ม → ยืนยัน = แทน `categoryId/name/amount/sourceType/sourceId/type` ของ entry เดิม (ยังคง `id/paid/paidAt`)
- **ปุ่ม "เพิ่มรายการ"** → Dialog: ชื่อ / จำนวนเงิน (optional) / หมวดหมู่ (Select label=ชื่อไทย) / checkbox "บันทึกเป็น template ด้วย"
  - insert `ledger_entries`: `type='ONE_TIME_COST'`, `sourceType=null`, `sourceId=null`, `paid=false`
  - ถ้าติ๊ก "บันทึกเป็น template" + ยังไม่มีชื่อนี้ใน templates → insert `fixed_cost_templates` (active=true) คู่กันไปด้วย

### Tab 2 — Template รายการจ่ายประจำ
จัดการ `fixed_cost_templates` **เท่านั้น** — ไม่แตะ `ledger_entries`

- list templates ทุก row (active + inactive ปนกัน, inactive แสดงด้วย opacity-50)
- ปุ่ม **"เพิ่ม template"** → Dialog: ชื่อ / จำนวนเงิน (optional) / หมวดหมู่ → insert (`active=true`)
- ต่อ row:
  - Checkbox = toggle `active` (เปิด/ปิด)
  - ชื่อ + CategoryBadge
  - `defaultAmount`: **inline-edit** เหมือน Tab 1 (Decimal string / null)
  - ปุ่ม ลบ → AlertDialog confirm ("รายการที่เคยดึงเข้าเดือนแล้วจะไม่ถูกลบ")

## UI rules

- **Tabs**: underline แบบ pure (active = `font-semibold text-primary` + `border-b-2 border-primary`; inactive = `text-muted-foreground`) · ไม่มีกล่อง outline · ไม่มี indicator overlay
- **Category dropdown** (Select): `value = category_id`, label = ชื่อไทย (ทั้งใน trigger และ option)
- **เงิน**: ผ่าน `formatMoney(string | number)` เสมอ — ห้าม hardcode `฿` / `THB` ใน component
- **เดือน**: ผ่าน `formatYearMonth(year, month)` → `YYYY/MM`
- **Summary**: Card แถวเดียวแนวนอน (`flex-row! flex-wrap`)
- **shadcn-only** · โทนมน ขอบโค้ง การ์ดนุ่ม · dark mode ยังไม่ทำ

## ขอบเขตรอบนี้

- mock data อย่างเดียว — state ใน client (`useState`), ยังไม่มี Server Action / DB / revalidatePath
- mock: 4 categories · 5 templates · 5 entries ของเดือนปัจจุบัน
- focus ที่ behavior ครบ ให้กดเล่นได้จริง: month nav · เพิ่ม/ลบ/ติ๊กจ่าย/inline-edit · ดึง template (รวม flow ชื่อซ้ำ) · จัดการ template tab 2

## Open questions (ตอนต่อ DB จริง)

- **template ถูกลบหลังถูกดึงลง ledger แล้ว** — entry มี `sourceId` ชี้ไปยัง template.id ที่หาย
  - ตอนนี้ schema กำหนด `sourceType/sourceId` เป็น `text` ล้วน (ไม่มี FK) → orphan ได้แบบเงียบ ๆ
  - ตัวเลือกตอน migrate: (ก) `ON DELETE SET NULL` ผ่าน FK จริง · (ข) `ON DELETE RESTRICT` กันลบถ้ามี ledger อ้างอยู่ · (ค) soft-delete template (เพิ่ม `deleted_at`) แล้วเก็บ row ไว้
  - แนะนำเลื่อนตัดสินใจไปตอน wiring DB จริง พร้อมตาราง `categories` (สถานะ category_id ก็ orphan ได้เหมือนกัน)
- **บันทึกเป็น template** ตอนเพิ่มรายการเอง ยังไม่ตั้ง `sourceId` กลับให้ entry นั้น — entry ที่ trigger ให้สร้าง template จะยัง `type='ONE_TIME_COST'` ปกติ ค่อยพิจารณาว่าจะ link ย้อนหรือเปล่า
- **categories** ยังไม่มีตาราง — `categoryId` เป็น text id แบบ `c-*` ใน mock; ตอนทำ admin table จริงต้องเปลี่ยนเป็น uuid + FK ทั้ง `fixed_cost_templates.category_id` และ `ledger_entries.category_id`

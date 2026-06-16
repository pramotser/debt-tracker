# Admin Section Spec

> ไฟล์นี้ครอบคลุมทุกอย่างที่เกี่ยวกับ admin — role gating, sidebar, และ 3 หน้า (banks / categories / users)  
> Claude Code: อ่านไฟล์นี้ก่อน build ทุกครั้ง

---

## 1. Role gating — หลักการ

- `role` มาจาก `public.users.role` ผ่าน `getCurrentUser()` → คืน `"admin" | "user"`
- **Sidebar** (server component): รับ `role` จาก portal layout → render admin section เฉพาะเมื่อ `role === "admin"`
- **หน้า admin** (server component): ทุกหน้าเรียก `getCurrentUser()` เอง แล้วเช็ค role → ถ้าไม่ใช่ admin ให้ `notFound()` (ไม่ redirect เพื่อกัน information leak)
- **Server Actions**: ทุก mutation ของ admin ต้อง assert `user.role === "admin"` ก่อน throw ถ้าไม่ใช่
- Bottom nav (`BottomNav`) เป็น client component ไม่รู้ role → **ไม่แสดง admin links** ใน bottom nav เลย (admin ใช้ sidebar desktop เท่านั้น)

---

## 2. Sidebar — การเปลี่ยนแปลง

**ไฟล์:** `src/components/layout/sidebar.tsx`  
**ปัจจุบัน:** รับแค่ `displayName: string`  
**เปลี่ยนเป็น:** รับ `displayName: string` และ `role: "admin" | "user"`

```tsx
// portal layout ส่ง role มาด้วย
<Sidebar displayName={displayName} role={user.role} />
```

**Admin section** แสดงเฉพาะ `role === "admin"` — วางใต้ main nav ก่อน bottom section:

```
─────────────────────
 [main nav: dashboard / รายการ / บัตร]
─────────────────────
 ผู้ดูแลระบบ          ← section label (12px, muted)
  🏦 ธนาคาร
  🏷️  หมวดหมู่
  👥 ผู้ใช้
─────────────────────
 [ตั้งค่า / ชื่อ / ออกจากระบบ]
```

**Icons (Lucide):** `Building2` (ธนาคาร) · `Tag` (หมวดหมู่) · `Users` (ผู้ใช้)  
**Routes:** `/banks` · `/categories` · `/users`  
**Active style:** เหมือน main nav (เส้นซ้าย navy + bg-secondary)

---

## 3. หน้า /banks

**Route:** `src/app/(portal)/banks/page.tsx`  
**Schema ปัจจุบัน:** ยังไม่มีตาราง `banks` ใน DB — ต้องสร้าง migration ใหม่  
**lib/banks.ts ปัจจุบัน:** มี `BANKS` constant (6 entries) + `getBankBrand()` — ยังคงไว้ระหว่าง migrate  

### 3a. Schema ใหม่ — ตาราง `banks`

```ts
// src/db/schema/banks.ts
export const banks = pgTable("banks", {
  id: text("id").primaryKey(),           // slug: "b-kbank", "b-scb" ฯลฯ (คงเดิมจาก lib/banks.ts)
  shortName: text("short_name").notNull(), // "KBank" — แสดงบนบัตร (chip)
  name: text("name").notNull(),           // "ธนาคารกสิกรไทย" — แสดงใน dropdown
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp(...).defaultNow(),
  updatedAt: timestamp(...).defaultNow(),
});
```

> **สี (brandBg / brandFg) ไม่อยู่ใน schema รอบนี้** — ยังใช้ `lib/banks.ts` ต่อ → จะมาทำรอบถัดไป  
> **ยังไม่เพิ่ม FK** `credit_cards.bank_id → banks.id` รอบนี้ — ทำใน migration แยกตอน migrate สี

### 3b. Seed data — 13 ธนาคารพาณิชย์ไทย

| id | shortName | name | sortOrder |
|---|---|---|---|
| b-bbl | BBL | ธนาคารกรุงเทพ | 1 |
| b-kbank | KBank | ธนาคารกสิกรไทย | 2 |
| b-ktb | KTB | ธนาคารกรุงไทย | 3 |
| b-ttb | TTB | ธนาคารทหารไทยธนชาต | 4 |
| b-scb | SCB | ธนาคารไทยพาณิชย์ | 5 |
| b-bay | BAY | ธนาคารกรุงศรีอยุธยา | 6 |
| b-kkp | KKP | ธนาคารเกียรตินาคินภัทร | 7 |
| b-cimbt | CIMBT | ธนาคารซีไอเอ็มบีไทย | 8 |
| b-uob | UOB | ธนาคารยูโอบี | 9 |
| b-tisco | TISCO | ธนาคารทิสโก้ | 10 |
| b-lhb | LHB | ธนาคารแลนด์ แอนด์ เฮ้าส์ | 11 |
| b-tcb | TCB | ธนาคารไทยเครดิต | 12 |
| b-ktc | KTC | บัตรกรุงไทย (KTC) | 13 |

> id ของ 6 แบงก์เดิม (b-uob, b-ttb, b-scb, b-kbank, b-kkp, b-ktc) คงเดิม — ไม่กระทบบัตรที่มีอยู่

### 3c. UI — หน้า /banks

**Layout:** เหมือน design ที่ approve แล้ว (ดู conversation)

```
[ธนาคาร]  [badge: admin]           [+ เพิ่มธนาคาร]
ข้อมูลกลาง · ใช้ตอนเพิ่มบัตร

┌─────────────────────────────────────────────┐
│ [chip] shortName  name           toggle  ✏️ 🗑️ │
│ ...                                          │
└─────────────────────────────────────────────┘
```

**Chip:** `div` เล็กๆ สี bg/fg จาก `getBankBrand(id)` (lib/banks.ts เดิม) — รอบนี้ยังใช้ hardcode  
**Toggle active:** inline switch → Server Action `toggleBankActive(id)`  
**Edit:** Dialog (shadcn `Dialog`) — แก้ `shortName` + `name` + `sortOrder` + `active`  
**Delete:** ได้เฉพาะ bank ที่ `cardCount === 0` → ถ้ามีบัตรใช้อยู่ปุ่มลบ disabled + tooltip "มีบัตรใช้งานอยู่"  
**Add:** Dialog เดียวกัน mode สร้างใหม่ — `id` = auto slug จาก shortName (lowercase + prefix `b-`)

### 3d. Queries & Actions

```
server/queries/banks.ts
  listBanks(): Bank[]                    // เรียงตาม sortOrder
  getBankCardCount(): Map<string, number> // นับบัตรต่อ bank_id

server/actions/banks.ts  (ทุก action assert admin ก่อน)
  createBank(input)
  updateBank(id, input)
  toggleBankActive(id)
  deleteBank(id)        // throw ถ้า cardCount > 0
```

---

## 4. หน้า /categories

**Route:** `src/app/(portal)/categories/page.tsx`  
**Schema:** มีอยู่แล้ว (`src/db/schema/categories.ts`) — ไม่ต้อง migrate  
**Data:** seeded แล้ว 19 rows  

### 4a. UI

```
[หมวดหมู่]  [badge: admin]          [+ เพิ่มหมวดหมู่]
ข้อมูลกลาง · ใช้แท็กรายการในทุก module

┌─────────────────────────────────────────────┐
│ [icon badge] name    is_system  toggle  ✏️ 🗑️ │
│ ...                                          │
└─────────────────────────────────────────────┘
```

**Icon badge:** วงกลมสี `colorBg` + icon (ชื่อ icon เก็บใน `icon` field — Lucide icon name)  
**is_system badge:** "ระบบ" (น้ำเงิน) / "กำหนดเอง" (เทา)  
**Toggle active + Edit + Delete:** เหมือน banks  
**Delete guard:** ถ้า `is_system = true` → ลบไม่ได้ (ปุ่มลบ disabled + tooltip "หมวดหมู่ระบบ")

### 4b. Queries & Actions

```
server/queries/categories.ts  (มี listCategories อยู่แล้ว — เพิ่ม listCategoriesAdmin)
  listCategoriesAdmin(): Category[]      // รวมทุก active/inactive

server/actions/categories.ts  (ทุก action assert admin ก่อน)
  createCategory(input)
  updateCategory(id, input)
  toggleCategoryActive(id)
  deleteCategory(id)    // throw ถ้า is_system = true
```

---

## 5. หน้า /users

**Route:** `src/app/(portal)/users/page.tsx`  
**Schema:** `public.users` มีอยู่แล้ว  

### 5a. UI — read-only (รอบนี้)

```
[ผู้ใช้]  [badge: admin]

┌──────────────────────────────────────────┐
│ ชื่อ                  role      สมัครเมื่อ │
│ Pramot S.            admin     01/06/69  │
│ ...                                      │
└──────────────────────────────────────────┘
```

**role badge:** "admin" (น้ำเงิน) / "user" (เทา)  
**รอบนี้:** แสดงอย่างเดียว — ไม่มี edit/delete ยังไม่จำเป็น  
**เหตุผล:** user จัดการผ่าน Supabase Dashboard ได้ตรงๆ, invite flow ทำทีหลัง

### 5b. Query

```
server/queries/users.ts
  listUsers(): User[]    // เรียงตาม created_at desc, assert admin
```

---

## 6. Plan — ลำดับงาน

```
Branch: feat/admin-section
```

ทำตามลำดับนี้ แต่ละขั้น `tsc` ผ่านก่อน commit:

1. **Sidebar role gating**
   - `portal/layout.tsx` ส่ง `role` ไปให้ `<Sidebar>`
   - `sidebar.tsx` รับ `role` prop + render admin section
   - `bottom-nav.tsx` ไม่ต้องแตะ

2. **Migration: สร้างตาราง banks + seed**
   - `src/db/schema/banks.ts` — schema ตามข้อ 3a
   - `src/db/schema/index.ts` — export banks
   - migration SQL: `CREATE TABLE banks ...` + `INSERT` 13 rows
   - รัน `drizzle-kit migrate` (session pooler 5432)

3. **หน้า /banks**
   - `server/queries/banks.ts`
   - `server/actions/banks.ts`
   - `app/(portal)/banks/page.tsx` + dialog component

4. **หน้า /categories**
   - `server/queries/categories.ts` เพิ่ม `listCategoriesAdmin`
   - `server/actions/categories.ts`
   - `app/(portal)/categories/page.tsx` + dialog component

5. **หน้า /users**
   - `server/queries/users.ts`
   - `app/(portal)/users/page.tsx` (read-only)

6. **Role guard ทุกหน้า**
   - ทุก page.tsx ข้างต้น: `if (user.role !== "admin") notFound()`
   - ทุก action: `if (user.role !== "admin") throw new Error("Forbidden")`

---

## 7. ไม่อยู่ใน scope รอบนี้

- สี brandBg / brandFg บน banks table (รอบถัดไป)
- FK `credit_cards.bank_id → banks.id` (รอบถัดไป พร้อม migration สี)
- Invite user / เปลี่ยน role ผ่าน UI (ทำผ่าน Supabase Dashboard ก่อน)
- หมวดหมู่ส่วนตัว (`owner_id != null`) — เผื่ออนาคต
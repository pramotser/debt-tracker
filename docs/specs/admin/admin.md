# Admin Section — spec

> ครอบคลุม admin ทั้งหมด — role gating, sidebar, และ 3 หน้า (banks / categories / users)
> สถานะ: **shipped** ทั้ง 3 หน้า · ไฟล์นี้สะท้อนสภาพปัจจุบัน (ไม่ใช่ build-plan แล้ว)

---

## 1. Role gating — หลักการ

- `role` มาจาก `public.users.role` ผ่าน `getCurrentUser()` → คืน `"admin" | "user"`
- **Sidebar** (server component): รับ `role` จาก portal layout → render admin section เฉพาะเมื่อ `role === "admin"`
- **หน้า admin** (server component): ทุกหน้าเรียก `getCurrentUser()` เอง แล้วเช็ค role → ถ้าไม่ใช่ admin ให้ `notFound()` (ไม่ redirect เพื่อกัน information leak)
- **Server Actions**: ทุก mutation ของ admin ต้อง assert `user.role === "admin"` ก่อน throw ถ้าไม่ใช่
- Bottom nav (`BottomNav`) เป็น client component ไม่รู้ role → **ไม่แสดง admin links** ใน bottom nav (admin ใช้ sidebar desktop เท่านั้น)

---

## 2. Sidebar

**ไฟล์:** `src/components/layout/sidebar.tsx` — รับ `displayName: string` + `role: "admin" | "user"`

```tsx
<Sidebar displayName={displayName} role={user.role} />
```

**Admin section** แสดงเฉพาะ `role === "admin"` — วางใต้ main nav ก่อน bottom section:

```
─────────────────────
 [main nav: Dashboard / รายการค่าใช้จ่าย / บัตรเครดิต]
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
**Active style:** เหมือน main nav

---

## 3. หน้า /banks

**Route:** `src/app/(portal)/banks/page.tsx` (guard `notFound()` ถ้าไม่ใช่ admin)
**Table component:** `src/features/admin/banks-table.tsx` · **Dialog:** `src/features/admin/bank-dialog.tsx`

### 3a. Schema — ตาราง `banks` (DB จริงแล้ว)

```ts
// src/db/schema/banks.ts
banks {
  id: text PK            // slug "b-<short>" (lower-case) — คงเดิมเพื่อไม่กระทบ credit_cards.bankId
  shortName: text        // "KBank" — chip บนบัตร
  name: text             // "ธนาคารกสิกรไทย" — dropdown / list
  brandBg: text          // #hex สีพื้น chip (default #5F5E5A)
  brandFg: text          // #hex สีตัวอักษร chip (default #F1EFE8)
  active: boolean        // default true
  sortOrder: integer     // default 0
  createdAt / updatedAt: timestamptz
}
// index: (active, sortOrder)
```

> **`brandBg` / `brandFg` อยู่ใน schema แล้ว** (เคยอยู่ใน `lib/banks.ts` — ย้ายเข้า DB แล้ว) → admin แก้สี chip ได้เองผ่าน `/banks`
> **`credit_cards.bankId` = logical FK → `banks.id`** (text · **ไม่มี FK formal** · ตั้งใจ ห้ามเปลี่ยนเป็น uuid — ดู CLAUDE.md schema lock)
> seed = 13 ธนาคารพาณิชย์ไทย (id 6 แบงก์เดิม b-uob/b-ttb/b-scb/b-kbank/b-kkp/b-ktc คงเดิม)

### 3b. UI

```
[ธนาคาร]  [badge: admin]                       [+ เพิ่มธนาคาร]
ข้อมูลกลาง · ใช้ตอนเพิ่มบัตร

[ 🔍 ค้นหา ชื่อ หรือชื่อย่อ ]   [ทั้งหมด ▾]   (count: ทั้งหมด/เปิด/ปิด)
┌─────────────────────────────────────────────┐
│ [chip] shortName  name           toggle  ✏️ 🗑️ │
│ ...                                          │
└─────────────────────────────────────────────┘
```

- **Chip:** สี `bank.brandBg` / `bank.brandFg` (จาก DB — ไม่ใช่ `getBankBrand` แล้ว)
- **ค้นหา:** input filter ตาม `shortName` / `name` (client-side)
- **Filter สถานะ:** `all | active | inactive` (Select · มี count ต่อสถานะ)
- **Toggle active:** inline switch → `toggleBankActive(id)`
- **Edit / Add:** Dialog เดียวกัน — ฟิลด์ `shortName` · `name` · `brandBg` · `brandFg` (มี live preview chip) · `sortOrder` · `active` · create: `id` = auto slug จาก shortName (lowercase + prefix `b-`)
- **Delete:** ได้เฉพาะ bank ที่ไม่มีบัตรผูก → ถ้ามีบัตรใช้อยู่ ปุ่มลบ disabled + tooltip

### 3c. Queries & Actions

```
server/queries/banks.ts
  listBanks()              // เรียงตาม sortOrder · ใช้ทั้ง /banks และ /credit-cards
  getBankCardCount()       // นับบัตรต่อ bankId (guard delete)

server/actions/banks.ts    (ทุก action assert admin ก่อน · revalidatePath('/banks'))
  createBank · updateBank · toggleBankActive · deleteBank (throw ถ้ามีบัตรผูก)
```

---

## 4. หน้า /categories

**Route:** `src/app/(portal)/categories/page.tsx` (guard `notFound()`)
**Table:** `src/features/admin/categories-table.tsx` · **Dialog:** `src/features/admin/category-dialog.tsx` · **Icon:** `src/features/admin/icon-picker.tsx`

### 4a. Schema (มีอยู่แล้ว — ไม่ต้อง migrate)

```
categories { id text PK · name · icon (Lucide name) · colorBg · colorFg ·
             ownerId uuid? (NULL = catalog ระบบ) · isSystem bool · sortOrder · active }
```

### 4b. UI

```
[หมวดหมู่]  [badge: admin]                      [+ เพิ่มหมวดหมู่]
ข้อมูลกลาง · ใช้แท็กรายการในทุก module

[ 🔍 ค้นหา ชื่อ หรือ id ]   [ทั้งหมด ▾]   (count: ทั้งหมด/เปิด/ปิด)
┌─────────────────────────────────────────────┐
│ [icon badge] name    ระบบ/กำหนดเอง  toggle  ✏️ 🗑️ │
│ ...                                          │
└─────────────────────────────────────────────┘
```

- **Icon badge:** วงกลมสี `colorBg`/`colorFg` + icon (จาก `icon` field — Lucide name · render ผ่าน `getCategoryIcon`)
- **ค้นหา:** filter ตาม `name` / `id` · **Filter สถานะ:** `all | active | inactive` (+ count)
- **is_system badge:** "ระบบ" / "กำหนดเอง"
- **Edit / Add:** Dialog — ฟิลด์ `name` · `icon` (IconPicker) · `colorBg` · `colorFg` (มี preview) · `sortOrder` · `active`
- **Delete guard:** ถ้า `isSystem = true` → ลบไม่ได้ (ปุ่ม disabled + tooltip)

### 4c. Queries & Actions

```
server/queries/categories.ts
  getCategories()          // active สำหรับ dropdown ทั่วแอป
  listCategoriesAdmin()    // รวมทุก active/inactive สำหรับหน้านี้

server/actions/categories.ts  (assert admin · revalidatePath('/categories'))
  createCategory · updateCategory · toggleCategoryActive · deleteCategory (throw ถ้า isSystem)
```

---

## 5. หน้า /users — read-only

**Route:** `src/app/(portal)/users/page.tsx` (guard `notFound()`)

```
[ผู้ใช้]  [badge: admin]
อ่านอย่างเดียว · จัดการ role ผ่าน Supabase Dashboard

┌──────────────────────────────────────────────┐
│ ชื่อเต็ม (formatFullName)        [role]  สมัครเมื่อ │
│ user id (มอนอ, มุม)                              │
└──────────────────────────────────────────────┘
```

- **role badge:** `admin` (default/น้ำเงิน) / `user` (secondary/เทา)
- **วันที่:** `th-TH-u-ca-buddhist` (พ.ศ. · `dd/mm/yy`)
- **Query:** `server/queries/users.ts` → `listUsers()` (เรียง created_at desc · assert admin)

---

## 6. ยังไม่อยู่ใน scope

- **Invite user / เปลี่ยน role ผ่าน UI** — ทำผ่าน Supabase Dashboard ก่อน
- **หมวดหมู่ส่วนตัว** (`ownerId != null`) — schema รองรับแล้ว แต่ยังไม่มี UI ให้ user สร้างเอง (เผื่ออนาคต)
- **FK formal `credit_cards.bankId → banks.id`** — ตั้งใจคงเป็น logical FK (text) ไม่ทำ FK constraint (CLAUDE.md lock)

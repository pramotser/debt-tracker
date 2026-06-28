# Subscription — overview

> ⚠️ **DEPRECATED — superseded by [`/recurring`](../recurring/recurring.md)**
> หน้า `/subscription` ถูกลบ · รวมเข้าเป็น `/recurring` (commit `2ed81ff`) · spec นี้อ้างตาราง `subscription_templates` ที่ไม่มีแล้ว (billingCycle/renewDate ย้ายไปอยู่บน `recurring_templates`) — เก็บเป็น history เท่านั้น

route `/subscription` · หน้าเดียว 2 tabs · จัดการ subscription/บริการที่ตัดเงินประจำ (รายเดือน/รายปี)

> page header แสดงเป็น **"สมาชิก/บริการ"** ไม่ใช่ "Subscription"

## โครงสร้าง

| Tab | ค่า `value` | ชื่อแสดง | spec |
|---|---|---|---|
| 1 | `month` (default) | รายการจ่ายรายเดือน | [`month-tab.md`](./month-tab.md) |
| 2 | `tpl` | รายการสมัคร | [`template-tab.md`](./template-tab.md) |

## Data fetch (server)

`src/app/(portal)/subscription/page.tsx` parse `?y=` + `?m=` (default = เดือนปัจจุบัน · validate `y` 1970-9999, `m` 1-12) แล้ว `Promise.all` 2 query:

| Query | คำอธิบาย |
|---|---|
| `listSubscriptionTemplates()` | template ทั้งหมดของ user · ORDER BY `active` DESC, `name` ASC |
| `listSubscriptionEntriesByMonth(y, m)` | ledger ของเดือนนั้น filter `type='SUBSCRIPTION'` · ORDER BY `createdAt` ASC |

ส่งเป็น props ลง `<SubscriptionApp>` (orchestrator client component)

## Data model

### ตารางที่เกี่ยวข้อง
```
subscription_templates
  ├─ userId, categoryId (text mock), name
  ├─ defaultAmount: numeric(12,2)  NOT NULL   ← ต่างจาก fixed_cost_templates ที่ nullable
  ├─ billingCycle: enum('monthly' | 'yearly')
  ├─ renewDate?: date              ← format ที่ DB คืน = "YYYY-MM-DD"
  └─ active

ledger_entries (subscription rows)
  ├─ type='SUBSCRIPTION'
  ├─ sourceType='subscription_template'  + sourceId=template.id  → ดึงจาก template
  ├─ amount?: numeric(12,2)        ← UI ไม่มี flow ใส่ null (import = copy defaultAmount มา)
  ├─ year, month
  └─ paid, paidAt
```

### `renewDate` semantics

- **monthly** → ใช้ `day` ของ renewDate เป็น "วันตัดเงินทุกเดือน" — แสดง "ตัดเงินทุกวันที่ X"
- **yearly** → ใช้ `day` + `month` เป็น "วันต่ออายุประจำปี" — แสดง "ต่อทุก X เดือน-ไทย"
- nullable ทั้งคู่ — `<TemplateDialog>` default = `todayIso()` ตอนเปิด ไม่ปล่อยให้ null
- **monthly**: ค่า month-part ของ renewDate ไม่มี effect — มีไว้แค่ให้ schema เหมือนกันกับ yearly

> **monthly ไม่ filter month-part** — banner โผล่ทุกเดือน
> **yearly filter month-part** — banner โผล่เฉพาะเดือนที่ตรงกับ `Number(renewDate.split("-")[1])`

## State management (`SubscriptionApp`)

```
src/features/subscription/subscription-app.tsx
```

state:
- `ym`, `templates`, `entries`
- `monthCacheRef: useRef<Map<string, LedgerEntry[]>>` — key = `ymKey(y,m)`
- `ymRef` — guard ใน async
- `dismissedMonths: Set<string>` — banner dismiss (client-only, ไม่ persist)
- `templatesById: useMemo<Map>` — ใช้ใน MonthView lookup CycleBadge

dialog state:
- `templateDialogOpen`, `editingTemplate` (null = create mode), `importOpen`
- `pendingDeleteTemplateId`, `pendingDeleteLedgerId` — แยก 2 ตัวสำหรับ 2 confirm dialog ต่างกัน

> ไม่มี `useEffect` sync server props (เหมือน monthly-cost) — ไม่มี action ที่เรียก `router.refresh()`

## Pending templates (derive ใน client)

```ts
pendingTemplates = templates.filter(t => {
  if (!t.active) return false
  if (usedSourceIds.has(t.id)) return false   // ดึงเข้าเดือนนี้แล้ว
  if (t.billingCycle === "yearly") {
    if (!t.renewDate) return false             // yearly ไม่มี renewDate → ไม่เคยต้องต่อ
    const monthPart = Number(t.renewDate.split("-")[1])
    if (monthPart !== ym.month) return false   // yearly ที่ไม่ใช่เดือนต่ออายุ → ไม่นับ
  }
  return true
})
```

ใช้ตัดสินใจ:
1. แสดง banner เตือนใน month-tab (ถ้ายังไม่ dismiss)
2. ส่งเข้า `<ImportModal>` (auto-check ทุกอัน)

## Server actions (ทุกตัว `revalidatePath('/subscription')`)

`src/server/actions/subscription-templates.ts`
- `createSubscriptionTemplate(input)` · `updateSubscriptionTemplate(id, input)` — รับ full upsert payload (name/categoryId/defaultAmount/billingCycle/renewDate)
- `toggleSubscriptionTemplateActive(id, active)`
- `deleteSubscriptionTemplate(id)`

`src/server/actions/subscription-ledger.ts` — ทุกตัว filter `type='SUBSCRIPTION'` ใน WHERE
- `fetchSubscriptionEntriesByMonth(y, m)` — **ไม่ revalidate**
- `toggleSubscriptionPaid(id, paid)`
- `updateSubscriptionAmount(id, amount)` — **amount required string** (ต่างจาก monthly-cost ที่ accept null)
- `deleteSubscriptionLedger(id)`
- `importSubscriptionsToMonth(ids, y, m)` — server-side dedupe ด้วย `sourceId` (เหมือน monthly-cost)

> ⚠️ **ไม่มี action สร้าง one-time subscription manually** — flow เพิ่ม ledger row เดียวเท่านั้นคือ "เพิ่ม template + import" หรือ "import ตรงๆ"

## Logic cross-tab

1. **เพิ่ม template (tab 2 → tab 1)**
   - สร้าง template ใน tab 2 → ปรากฏใน banner ของ tab 1 (ถ้า active + ยังไม่ดึง + ถ้า yearly ตรงเดือน)

2. **ดึง template เข้าเดือน (tab 2 → tab 1)**
   - banner / `<ImportModal>` → `importSubscriptionsToMonth(ids, y, m)` → server insert ledger rows (`SUBSCRIPTION` + `sourceType='subscription_template'`)
   - server **dedupe ด้วย sourceId** — ดึงซ้ำในเดือนเดิม → skip

3. **แก้ template (tab 2)**
   - update `subscriptionTemplates` ตรงๆ — **ไม่กระทบ ledger rows เดิม** (ที่ดึงไปแล้ว amount/name ที่ snapshot มา ไม่เปลี่ยน)

4. **ลบ template (tab 2)**
   - ลบ template เฉยๆ → ledger rows orphan (sourceId ยังอยู่ แต่ template หาย) — UI ยังแสดง row ปกติ แต่ **CycleBadge เปลี่ยนเป็น "เพิ่มเอง"** (templatesById.get(sourceId) คืน null)

## UI rules

- shadcn-only · เงินผ่าน `formatMoney` · เดือนผ่าน `formatYearMonth` (`YYYY/MM`)
- Tab trigger style = underline pure
- ทุก mutation = optimistic + rollback · `toast.error` ทุก fail
- หมวดหมู่ใช้ `MOCK_CATEGORIES` (4 หมวด: **Streaming, Music, Software/AI, อื่นๆ**) — id `c-streaming`, `c-music`, `c-software`, `c-other`
- **ลบ ledger row** = ต้อง confirm (`AlertDialog`) ต่างจาก monthly-cost
- **CycleBadge สี**:
  - monthly = น้ำเงิน (`border-blue-300 bg-blue-50 text-blue-700`)
  - yearly = อำพัน (`border-amber-300 bg-amber-50 text-amber-700`)
  - ไม่มี template (orphan) = "เพิ่มเอง" สีเทา

## Open questions

- **orphan ledger หลังลบ template** — CycleBadge แสดง "เพิ่มเอง" ทั้งๆ ที่ลบ template ออก ไม่ใช่ user เพิ่มเอง → ถ้าจะแยก state จริงๆ ต้องเพิ่ม flag หรือเปลี่ยนเป็น `ON DELETE SET NULL` ที่ FK
- **monthly กับ month-part ของ renewDate** — ตอนนี้ ignore month-part สำหรับ monthly → ถ้า user สร้าง monthly แล้วเลือกวันที่ 15 ม.ค. → ทุกเดือนจะ "ตัดเงินทุกวันที่ 15" (ม.ค. ไม่มี effect) — ตั้งใจให้เป็นแบบนี้
- **ไม่มี one-time SUBSCRIPTION** — UI ตอนนี้บังคับให้สร้าง template ก่อน import ถ้าจะ track "บริการครั้งเดียว" ต้องเพิ่ม flow ใหม่ (เพิ่มปุ่ม `+ เพิ่มรายการ` ใน month-tab + server action สร้าง row โดยตรง)
- **categories ยัง text mock** — เปลี่ยนเป็น uuid + FK เมื่อต่อ admin categories table

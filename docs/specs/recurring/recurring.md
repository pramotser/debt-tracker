# Recurring — overview

route `/recurring` · header **"รายการค่าใช้จ่าย"** · หน้าเดียว 2 tabs · จัดการรายจ่ายประจำ (รายเดือน/รายปี) + รายการครั้งเดียวของแต่ละเดือน

> โมดูลนี้ = **การรวม `/monthly-cost` + `/subscription` เข้าด้วยกัน** (commit `2ed81ff`) → 2 หน้าเดิมถูกลบ · template ทั้งสองชนิดยุบเป็นตารางเดียว `recurring_templates`
> spec เดิม `docs/specs/monthly-cost/` + `docs/specs/subscription/` = **superseded** (deprecated header ชี้มาที่ไฟล์นี้)

## โครงสร้าง

| Tab | ค่า `value` | ชื่อแสดง | spec |
|---|---|---|---|
| 1 | `month` (default) | รายการเดือนนี้ | [`month-tab.md`](./month-tab.md) |
| 2 | `tpl` | ตั้งค่ารายการประจำ | [`template-tab.md`](./template-tab.md) |

> Tab ไม่ใช้ `keepMounted` — state ทั้งหมดอยู่ที่ orchestrator `RecurringApp` แล้ว สลับ tab ไม่รีเซ็ตเพราะ component ไม่ unmount

## Data fetch (server)

`src/app/(portal)/recurring/page.tsx` parse `?y=` + `?m=` (default = เดือนปัจจุบัน · validate `y` 1970-9999, `m` 1-12) แล้ว `Promise.all` 3 query:

| Query | คำอธิบาย |
|---|---|
| `listRecurringTemplates()` | template ทั้งหมดของ user (active + inactive) |
| `listRecurringEntriesByMonth(y, m)` | ledger ของเดือนนั้นใน scope หน้านี้ (ดูด้านล่าง) ordered `createdAt` asc |
| `getCategories()` | dropdown หมวดหมู่จาก DB (ไม่ใช่ mock แล้ว) |

ส่งทั้งหมดเป็น props ลง `<RecurringApp>` (`src/features/recurring/recurring-app.tsx`)

## Data model

### ตาราง `recurring_templates` (รวม fixed-cost + subscription)

```
recurring_templates
  ├─ userId, categoryId (text · logical join ฝั่ง app), name
  ├─ defaultAmount?: numeric(12,2)   NULL ได้ = "กรอกทีหลัง" (เช่นค่าไฟยอดไม่คงที่)
  ├─ billingCycle: enum('monthly' | 'yearly')   default monthly
  ├─ renewDate?: date    monthly = วันตัดเงิน · yearly = เดือน+วันต่ออายุ (DB คืน "YYYY-MM-DD")
  └─ active
```

> ต่างจากของเดิม: `fixed_cost_templates` (defaultAmount nullable, ไม่มี cycle) + `subscription_templates` (defaultAmount NOT NULL, มี cycle) → **ยุบเป็นตัวเดียว** defaultAmount nullable + มี billingCycle

### scope ของ ledger ในหน้านี้

```
ledger_entries (เฉพาะที่หน้านี้ query/แก้)
  ├─ type='FIXED_COST'    + sourceType='recurring_template' + sourceId=template.id  → ดึงจาก template
  └─ type='ONE_TIME_COST' + sourceType=null                 + sourceId=null         → เพิ่มเอง (ad-hoc)
  ├─ amount?: numeric(12,2)   NULL = "แตะเพื่อกรอก"
  ├─ year, month             (1-12)
  └─ paid, paidAt
```

> ⚠️ **import = ลง `type=FIXED_COST` เสมอ** (ไม่มี `SUBSCRIPTION` ใน flow หน้านี้แล้ว — billingCycle ของ subscription เก็บไว้ที่ template เท่านั้น) · `type=SUBSCRIPTION` ใน enum ยังคงอยู่เพื่อ backward-compat ของ data เก่า แต่หน้านี้ไม่สร้างใหม่
> `categoryId` = text เปล่า (ไม่มี FK formal · join ฝั่ง app) — ตั้งใจ (CLAUDE.md lock)

## State management (`RecurringApp`)

state:
- `ym` (initial จาก URL) · `templates` · `entries`
- `monthCacheRef: useRef<Map<string, LedgerEntry[]>>` — key = `ymKey(y,m)` · seed ด้วยเดือนแรก · `mutateCurrentMonth` sync cache ทุกครั้งที่แก้ entries
- `ymRef` — guard ใน async ว่ายังอยู่เดือนเดิม
- `dismissedMonths: Set<string>` — เดือนที่กด "ข้าม" banner (client-only, ไม่ persist)
- `templatesById: useMemo<Map>` — lookup CycleBadge ใน MonthView

dialog/confirm state:
- `templateDialogOpen` + `editingTemplate` (null = create) · `importOpen` · `addItemOpen`
- `pendingDeleteTemplateId` · `pendingDeleteLedgerId` (2 confirm แยกกัน)
- `pendingAmountEdit` — สำหรับ 3-way amount edit dialog

> เปลี่ยนเดือน = `navigateMonth(delta)` → `shiftMonth` + `history.replaceState(?y=&m=)` → อ่าน cache ถ้ามี ไม่งั้น `fetchRecurringEntriesByMonth` (ไม่ revalidate)

## Pending templates (derive ใน client)

```ts
pendingTemplates = templates.filter(t => {
  if (!t.active) return false
  if (usedSourceIds.has(t.id)) return false        // ดึงเข้าเดือนนี้แล้ว
  if (t.billingCycle === "yearly") {
    if (!t.renewDate) return false
    if (Number(t.renewDate.split("-")[1]) !== ym.month) return false  // yearly เฉพาะเดือนต่ออายุ
  }
  return true
})
// usedSourceIds = sourceId ของ entries เดือนนี้ ที่ sourceType === 'recurring_template'
```

ใช้: (1) banner เตือนใน month-tab · (2) ส่งเข้า `<ImportModal>` (auto-check ทุกอัน)

## Server actions

`src/server/actions/recurring-templates.ts` (ทุกตัว `revalidatePath('/recurring')`)
- `createRecurringTemplate` · `updateRecurringTemplate` · `toggleRecurringTemplateActive` · `updateRecurringTemplateDefaultAmount` · `deleteRecurringTemplate`

`src/server/actions/recurring-ledger.ts` — ทุกตัวคุม `pageScope` ใน WHERE (FIXED_COST+recurring_template **หรือ** ONE_TIME_COST+null)
- `fetchRecurringEntriesByMonth(y, m)` — **ไม่ revalidate** (client cache เปลี่ยนเดือน)
- `toggleRecurringPaid` · `updateRecurringAmount` (null ได้) · `deleteRecurringLedger`
- `createOneTimeEntry` — สร้าง `type=ONE_TIME_COST` (source = null)
- `importRecurringToMonth(ids, y, m)` — insert `type=FIXED_COST` หลาย row + **server-side dedupe ด้วย sourceId** (skip template ที่มี ledger ในเดือนนั้นแล้ว)

> ✅ ต่างจาก spec เดิม: `recurring-ledger` actions **filter ด้วย `pageScope`** ทุกตัว — ปิด attack surface ที่ monthly-cost เดิมไม่ได้ filter type

## Logic cross-tab

1. **ดึง template เข้าเดือน (tab 2 → tab 1)** — banner / `<ImportModal>` → `importRecurringToMonth` → insert `FIXED_COST` + `sourceType='recurring_template'` + `amount = template.defaultAmount` · dedupe ด้วย sourceId → ดึงซ้ำปลอดภัย
2. **แก้ยอดใน month-tab → ถาม sync template มั้ย (3-way)** — ถ้า ledger row นั้นมาจาก template ที่ "ตั้งยอดไว้" → เปิด dialog: **แก้เฉพาะเดือนนี้** / **อัปเดต template ด้วย** / ยกเลิก · ถ้า template ไม่ตั้งยอด หรือเป็น one-time → save ทันทีไม่ถาม
3. **เพิ่มรายการครั้งเดียว (tab 1)** — `<AddItemDialog>` → `createOneTimeEntry` (`ONE_TIME_COST`) — ไม่ผูก template
4. **ลบ template (tab 2)** — ลบ template เฉยๆ · ledger rows ที่ดึงไปแล้ว **คงอยู่** (orphan, `templatesById.get` คืน null → CycleBadge เป็น "เพิ่มเอง") · เดือนถัดไปไม่มีใน pending list อีก

## UI rules

- shadcn-only · เงินผ่าน `formatMoney` · เดือนผ่าน `formatYearMonth` (`YYYY/MM`)
- Tab trigger = underline pure (active = `font-semibold text-primary` + `border-b-2`)
- `amount === null` → ตัวเลขแสดง "แตะเพื่อกรอก" (inline edit) · template = "เว้นว่างได้ (กรอกทีหลัง)"
- ทุก mutation = **optimistic + rollback** ใน catch · `toast.error` ทุกครั้งที่ fail
- หมวดหมู่ดึงจาก DB (`getCategories`) ผ่าน `CategoryPickerGrid` / badge (`src/components/shared/category-*`)
- ลบ ledger row + ลบ template = ต้อง confirm (`AlertDialog`) แยกกัน

## Open questions

- **orphan ledger หลังลบ template** — row คงอยู่แต่ CycleBadge เป็น "เพิ่มเอง" → ถ้าจะแยกจริงต้องเพิ่ม flag (schema ตั้งใจไม่มี FK)
- **monthly กับ month-part ของ renewDate** — monthly ignore month-part (ใช้แค่ day) — ตั้งใจ
- **dismissedMonths client-only** — รีเฟรชแล้ว banner กลับมา — ตั้งใจ

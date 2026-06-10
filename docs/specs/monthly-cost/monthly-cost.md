# Monthly Cost — overview

route `/monthly-cost` · หน้าเดียว 2 tabs · จัดการค่าใช้จ่ายรายเดือน (FIXED_COST + ONE_TIME_COST)

> ใช้ตาราง `ledger_entries` + `fixed_cost_templates` ต่อ Supabase Postgres เรียบร้อยแล้ว ไม่ใช่ mock-only เหมือนใน spec v1

## โครงสร้าง

| Tab | ค่า `value` | ชื่อแสดง | spec |
|---|---|---|---|
| 1 | `month` (default) | รายการจ่ายรายเดือน | [`month-tab.md`](./month-tab.md) |
| 2 | `tpl` | ตั้งค่ารายการประจำ | [`template-tab.md`](./template-tab.md) |

> ⚠️ tab `tpl` ไม่ใช้ `keepMounted` (ต่างจาก credit-cards) — state ของแต่ละ tab อยู่ที่ orchestrator `MonthlyCostApp` แล้ว สลับ tab ไม่รีเซ็ตเพราะไม่ unmount

## Data fetch (server)

`src/app/(portal)/monthly-cost/page.tsx` parse `?y=` + `?m=` (default = เดือนปัจจุบัน · validate `y` 1970-9999, `m` 1-12) แล้ว `Promise.all` 2 query:

| Query | คำอธิบาย |
|---|---|
| `listTemplates()` | template ทั้งหมดของ user (active + inactive) ordered `createdAt` asc |
| `listFixCostEntriesByMonth(y, m)` | ledger row ของเดือนนั้น filter `type IN ('FIXED_COST', 'ONE_TIME_COST')` ordered `createdAt` asc |

ส่งทั้งสองเป็น props ลง `<MonthlyCostApp>` (orchestrator client component)

## Data model

### ตารางที่เกี่ยวข้อง
```
fixed_cost_templates  (template — ใช้ดึงเข้าเดือนซ้ำๆ)
  ├─ userId, categoryId (text mock), name
  ├─ defaultAmount?: numeric(12,2)   NULL = "กรอกเอง"
  └─ active

ledger_entries (รายจ่ายจริง)
  ├─ type='FIXED_COST'    + sourceType='fixed_cost_template' + sourceId=template.id  → ดึงจาก template
  └─ type='ONE_TIME_COST' + sourceType=null + sourceId=null                          → เพิ่มเอง
  ├─ amount?: numeric(12,2)   NULL = "แตะเพื่อกรอก"
  ├─ year, month             (1-12)
  └─ paid, paidAt
```

### ความสัมพันธ์ template → ledger
- template **ไม่มี FK** กับ ledger — เก็บลิงก์ผ่าน `sourceType='fixed_cost_template'` + `sourceId=template.id` (text ทั้งคู่)
- ลบ template ที่เคยถูกดึง → ledger row เดิม **orphan** (sourceId ยังอยู่แต่ template หายแล้ว) — ไม่กระทบ UI เพราะ row อิงตัวเองอยู่แล้ว

## State management (`MonthlyCostApp`)

```
src/features/monthly-cost/monthly-cost-app.tsx
```

state:
- `ym` (initial = `initialYm` จาก URL)
- `entries` (initial = `initialEntries`)
- `templates` (initial = `initialTemplates`)
- `monthCacheRef: useRef<Map<string, LedgerEntry[]>>` — key = `ymKey(y,m)` · seed ด้วยเดือนแรก
- `ymRef` — guard ใน async ว่ายังอยู่เดือนเดียวกัน
- `dismissedMonths: Set<string>` — เก็บเดือนที่กด "ข้าม" banner (client-only, ไม่ persist)

dialog state:
- `addItemOpen`, `addTemplateOpen`, `importOpen`, `pendingDeleteTemplateId`

> ไม่มี `useEffect` sync จาก server props ใหม่ (ต่างจาก credit-cards) — เพราะหน้านี้ไม่มี action ที่เรียก `router.refresh()` (mutation ทั้งหมด optimistic + server `revalidatePath` แต่ client state ดูแลตัวเอง)

## Pending templates (derive ใน client)

```ts
pendingTemplates = templates.filter(t =>
  t.active && !usedSourceIds.has(t.id)
)
// usedSourceIds = sourceId ของ entries ในเดือนนี้ ที่ sourceType === 'fixed_cost_template'
```

ใช้:
1. คำนวณว่ามี template active ที่ "ยังไม่ดึงเข้าเดือนนี้" กี่ตัว → แสดง banner เตือน (เฉพาะเดือนที่ยังไม่ dismiss)
2. ส่งเข้า `<ImportModal>` ให้ user เลือก (auto-check ทุกอัน)

## Server actions (ทุกตัว `revalidatePath('/monthly-cost')`)

`src/server/actions/fixed-cost-templates.ts`
- `createTemplate` · `updateTemplateDefaultAmount` · `toggleTemplateActive` · `deleteTemplate`

`src/server/actions/ledger-entries.ts`
- `fetchFixCostEntriesByMonth(y, m)` — **ไม่ revalidate** (client cache เปลี่ยนเดือน)
- `createLedgerEntry` — สร้าง `type='ONE_TIME_COST'` (sourceType/sourceId = null)
- `toggleLedgerEntryPaid` · `updateLedgerEntryAmount` · `deleteLedgerEntry`
- `importFixCostTemplatesToMonth(ids, y, m)` — สร้าง `type='FIXED_COST'` หลาย row + **server-side dedupe** (skip template ที่มี ledger sourceId ตรงในเดือนนั้นแล้ว)

> ⚠️ `updateLedgerEntryAmount` / `toggleLedgerEntryPaid` / `deleteLedgerEntry` **ไม่ filter `type`** — แปลว่า client ของหน้านี้ "แก้ ledger row ไหนก็ได้ของ user" ตามทฤษฎี (รวม CREDIT_CARD ฯลฯ) — ผ่าน UI ปกติเป็นไปไม่ได้เพราะ entries ที่ดึงมาเป็น FIXED/ONE_TIME เท่านั้น แต่เป็น attack surface ที่ควรรู้

## Logic cross-tab

1. **เพิ่มรายการ + บันทึกเป็น template (tab 1 → tab 2)**
   - ติ๊ก "บันทึกเป็น template ด้วย" ใน `<AddItemDialog>` → สร้าง ledger row (`ONE_TIME_COST`) + check `templates.some(name === normalize)` ถ้าไม่มี → สร้าง template ใหม่ (`active=true`)
   - normalize = `name.trim().toLocaleLowerCase('th')`
   - **ledger row นี้ไม่ตั้ง sourceId ย้อนกลับ** — ยัง `type=ONE_TIME_COST` ปกติ (ดู open question)

2. **ดึง template เข้าเดือน (tab 2 → tab 1)**
   - banner หรือ `<ImportModal>` → `importFixCostTemplatesToMonth(ids, y, m)` → server insert ledger rows (`type=FIXED_COST` + `sourceType='fixed_cost_template'` + `sourceId=template.id` + `amount = template.defaultAmount`)
   - server **dedupe ด้วย sourceId** — ถ้าเดือนนั้นมี ledger ที่ sourceId ตรง template.id แล้ว → skip
   - ดังนั้น "ดึงซ้ำ" ปลอดภัย ไม่สร้าง duplicate

3. **ลบ template (tab 2)**
   - ลบ template เฉยๆ → ledger rows เดิมที่ sourceId ชี้ไป template นี้ → **orphan** (UI ไม่เห็นความแตกต่างเพราะ row พึ่งตัวเอง)
   - banner / pending list ของเดือนถัดไปจะไม่มี template นี้แล้ว

## UI rules

- shadcn-only · เงินผ่าน `formatMoney` · เดือนผ่าน `formatYearMonth` (`YYYY/MM`)
- Tab trigger style = underline pure (active = `font-semibold text-primary` + `border-b-2`)
- `amount === null` (ทั้ง ledger + template) → ตัวเลขแสดงเป็น "แตะเพื่อกรอก" (ส้ม) / "กรอกเอง" (มี่จาง) — แตะตรงนั้นเข้า inline edit
- ทุก mutation = optimistic + rollback ใน catch · `toast.error` ทุกครั้งที่ fail
- หมวดหมู่ใช้ `MOCK_CATEGORIES` (4 หมวด: เงินกู้, ครอบครัว, ค่าน้ำค่าไฟ, อื่นๆ) — `categoryId` เป็น text mock (`c-loan`, `c-family`, `c-utility`, `c-other`)
- `DEV_USER_ID = '00000000-0000-0000-0000-000000000001'` — ตรงกับ seed + `lib/auth.getCurrentUser()` (dev mode)

## Open questions

- **template orphan หลังถูกลบ** — ledger row ยังอยู่แต่ template หาย แนะนำหลังต่อ admin tables: เพิ่ม FK + `ON DELETE SET NULL` (เก็บ row ไว้ ตัด sourceId)
- **"บันทึกเป็น template" ไม่ link กลับ** — ledger row ที่ trigger สร้าง template ยัง `type=ONE_TIME_COST` ไม่ใช่ `FIXED_COST` — ถ้าต้องการเชื่อม ต้อง update row เพิ่ม `sourceId/sourceType/type` หลังสร้าง template เสร็จ
- **categories ยังเป็น text mock** — ตอนทำ admin categories table จะเปลี่ยน `categoryId` ของทั้ง `fixed_cost_templates` และ `ledger_entries` เป็น uuid + FK
- **dismissedMonths client-only** — กด "ข้าม" banner แล้วรีเฟรชหน้า → กลับมาเตือนใหม่ (เพราะ Set อยู่ใน state ไม่ persist) — ตั้งใจให้เป็นแบบนี้

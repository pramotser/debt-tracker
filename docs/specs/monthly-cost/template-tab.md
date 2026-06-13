# Template Tab — ตั้งค่ารายการประจำ

> ดู overview ก่อน: [`monthly-cost.md`](./monthly-cost.md)

`tab value = "tpl"` · file: `src/features/monthly-cost/template-view.tsx` (state อยู่ที่ `monthly-cost-app.tsx`)

## วัตถุประสงค์

CRUD `fixed_cost_templates` — รายการจ่ายประจำที่ใช้ดึงเข้ารายเดือนซ้ำๆ (ไม่แตะ `ledger_entries`)

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                          [ + เพิ่มรายการประจำ ]  │
├─────────────────────────────────────────────────────────────────┤
│ [🟢]  ค่าเช่าบ้าน          [ครอบครัว]       ฿8,000.00    [🗑] │
│ [🟢]  ค่าน้ำค่าไฟ          [ค่าน้ำค่าไฟ]    กรอกเอง       [🗑] │
│ [🔴]  Netflix              [อื่นๆ]         ฿349.00       [🗑] │ ← opacity 50
└─────────────────────────────────────────────────────────────────┘
```

### Header
- ปุ่ม `[ + เพิ่มรายการประจำ ]` (right) → เปิด `<AddTemplateDialog>`

### Empty state
ถ้า `templates.length === 0`: "ยังไม่มี template กด 'เพิ่มรายการประจำ'"

### TemplateRow (Card ต่อ row)
- **Switch** (active toggle)
  - `data-checked:bg-emerald-500` (เขียว = active)
  - `data-unchecked:bg-rose-500` (แดง = inactive)
- ชื่อ template + `<CategoryBadge>`
- `!active` → `opacity-50` ทั้ง card
- ยอดเงิน (`defaultAmount`):
  - `null` → ปุ่ม "กรอกเอง" สี `text-muted-foreground`
  - มีค่า → ปุ่ม `formatMoney(defaultAmount)` ที่กดได้
  - inline edit: Input type=number → Enter/blur commit, Esc cancel
  - commit: empty → `null` · มีค่า → `n.toFixed(2)` (ถ้า NaN → `null`)
- ปุ่มลบ (Trash icon, hover แดง) → เปิด `<AlertDialog>` confirm

> **ไม่มี edit dialog** — แก้ name/category ไม่ได้ผ่าน UI ปัจจุบัน (server action ก็มีแค่ `updateTemplateDefaultAmount`) แก้ได้แค่ `defaultAmount` inline กับ `active` toggle

## State

ทุกตัวอยู่ที่ `MonthlyCostApp`:
- `templates: FixedCostTemplate[]` — initial = `initialTemplates`
- `addTemplateOpen: boolean`
- `pendingDeleteTemplateId: string | null`

## Mutations (optimistic + rollback)

| Handler | Server action | Optimistic | Rollback |
|---|---|---|---|
| `submitTemplate(d)` → `persistNewTemplate` | `createTemplate({name, categoryId, defaultAmount})` | insert temp template id=`tmp-${Date.now()}` (active=true) | filter temp ออก + toast — success: replace temp ด้วย row จริง |
| `handleToggleTemplateActive(id)` | `toggleTemplateActive(id, next)` | flip `active` + `updatedAt` | flip กลับ + toast |
| `handleUpdateTemplateDefaultAmount(id, amt)` | `updateTemplateDefaultAmount(id, amt)` | set `defaultAmount` (string \| null) + `updatedAt` | restore `prev.defaultAmount` + toast |
| `confirmDeleteTemplate()` | `deleteTemplate(id)` | filter ออก | push prev กลับ + toast |

### `persistNewTemplate` — reuse กับ tab 1
```ts
function persistNewTemplate(input: { name, categoryId, defaultAmount })
```
ถูกเรียกจาก 2 ที่:
- `submitTemplate` (tab 2 — เพิ่มรายการประจำ โดยตรง)
- `submitItem` (tab 1 — ติ๊ก "บันทึกเป็น template ด้วย" ตอนเพิ่มรายการ + ชื่อยังไม่ซ้ำ)

## Delete flow

1. กดปุ่มลบ → set `pendingDeleteTemplateId = id`
2. `<AlertDialog>` เปิดอัตโนมัติ (open = `pendingDeleteTemplateId !== null`)
3. Body: "ลบ '{name}' ออกจากรายการ template **รายการที่เคยดึงเข้าเดือนแล้วจะไม่ถูกลบ**"
4. Confirm → `confirmDeleteTemplate()` (optimistic remove + `deleteTemplate(id)`)
5. fail → push prev กลับ + toast

> ledger rows ที่ sourceId ชี้ไป template นี้ → **orphan** (ยังอยู่ใน DB ต่อ ดูที่ overview)

## AddTemplateDialog (`template-dialog.tsx`)

ฟิลด์:
| ฟิลด์ | type | required | หมายเหตุ |
|---|---|---|---|
| ชื่อ | text | ✓ | autoFocus, `trim().length > 0` |
| จำนวนเงิน | number | — | optional · empty → `null` · `n.toFixed(2)` |
| หมวดหมู่ | Select | ✓ | `MOCK_CATEGORIES`, default = `categories[0]` |

`TemplateDraft`:
```ts
{ name: string; defaultAmount: string | null; categoryId: string }
```

> ไม่มีฟิลด์ `active` — default = `true` ที่ server (`fixedCostTemplates.active` default `true` ใน schema)

## Server actions ที่ใช้

`src/server/actions/fixed-cost-templates.ts` — ทุกตัว `revalidatePath('/monthly-cost')`

| Action | คำอธิบาย |
|---|---|
| `createTemplate({name, categoryId, defaultAmount})` | insert + return row |
| `updateTemplateDefaultAmount(id, amt)` | update เฉพาะ `defaultAmount` + `updatedAt` |
| `toggleTemplateActive(id, active)` | update เฉพาะ `active` + `updatedAt` |
| `deleteTemplate(id)` | DELETE — ไม่ลบ ledger rows ที่ผูกอยู่ |

> ทุก action filter `userId` กับ `id` เพื่อกัน user แก้ template ของคนอื่น (validate ด้วย zod uuid + `getCurrentUser()`)

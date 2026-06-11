# Template Tab — รายการสมัคร

> ดู overview ก่อน: [`subscription.md`](./subscription.md)

`tab value = "tpl"` · file: `src/features/subscription/template-view.tsx` (state อยู่ที่ `subscription-app.tsx`)

## วัตถุประสงค์

CRUD `subscription_templates` — บริการที่ตัดเงินประจำ (รายเดือน/รายปี) ใช้เป็นต้นทางของ import เข้า ledger รายเดือน

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ active 3 รายการ · inactive 1 รายการ        [ + เพิ่มบริการ ]   │
├─ ACTIVE (3) ───────────────────────────────────────────────────┤
│ ┌─ [🟢] Netflix         [รายเดือน] [Streaming]              ─┐ │
│ │       ตัดเงินทุกวันที่ 15                ฿201.00       [⋯] │ │
│ └────────────────────────────────────────────────────────────┘ │
│ ┌─ [🟢] ChatGPT Plus    [รายปี] [Software/AI]               ─┐ │
│ │       ต่อทุก 1 ก.ย.                       ฿649.00       [⋯] │ │
│ └────────────────────────────────────────────────────────────┘ │
├─ INACTIVE (1) ─────────────────────────────────────────────────┤
│ ┌─ [🔴] Spotify         [รายเดือน] [Music]                  ─┐ │
│ │                                            ฿119.00      [⋯] │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Header
- subtitle: "active X รายการ · inactive Y รายการ" (count แบบสด)
- ปุ่ม `[ + เพิ่มบริการ ]` (right) → เปิด `<TemplateDialog>` mode create

### Empty state
ถ้า `templates.length === 0`: "ยังไม่มีบริการ — กด 'เพิ่มบริการ'"

### Sections (เฉพาะที่มี)
- `Active (n)` — `templates.filter(t => t.active)`
- `Inactive (n)` — `templates.filter(t => !t.active)`

> เหมือน CardsTab ของ credit-cards — Section header style: `text-xs font-semibold uppercase tracking-wide text-muted-foreground`

### TemplateRow (Card ต่อ row)
- **Switch** (active toggle)
  - `data-checked:bg-emerald-500` (เขียว = active)
  - `data-unchecked:bg-rose-500` (แดง = inactive)
- ชื่อ template
- inline meta (`gap-1.5`):
  - **CycleBadge**: รายเดือน (blue) / รายปี (amber)
  - `<CategoryBadge>`
  - renewLabel (ดูข้างล่าง) — text muted ขนาด xs
- ยอด `defaultAmount` (right, fixed `min-w-[7rem]`, `text-base font-semibold tabular-nums`)
- `!active` → `opacity-50` ทั้ง card
- Dropdown menu (⋯):
  - "แก้ไข" → set `editingTemplate` + เปิด `<TemplateDialog>` mode edit
  - "ลบ" (สีแดง) → set `pendingDeleteTemplateId` → `<AlertDialog>` confirm

### `formatRenew(template)` helper
```ts
// renewDate = "YYYY-MM-DD" → parse day + month
// monthly → "ตัดเงินทุกวันที่ {day}"
// yearly  → "ต่อทุก {day} {TH_MONTHS[month-1]}"   // ม.ค./ก.พ./.../ธ.ค.
// renewDate = null หรือ format ผิด → return null (ไม่แสดง)
```

> **monthly**: ใช้แค่ day-part — month-part ไม่มี effect (ดู [overview](./subscription.md#renewdate-semantics))

## State

ทุกตัวอยู่ที่ `SubscriptionApp`:
- `templates: SubscriptionTemplate[]` (initial = `initialTemplates`)
- `templateDialogOpen: boolean`
- `editingTemplate: SubscriptionTemplate | null` (null = create mode)
- `pendingDeleteTemplateId: string | null`

## Mutations (optimistic + rollback)

### `handleSubmitTemplate(d)` — แยก 2 path: edit / create

**Edit path** (`editingTemplate !== null`):
1. optimistic: map update field ของ template id ใน `templates` ทันที (+ updatedAt = now)
2. `setEditingTemplate(null)`
3. ยิง `updateSubscriptionTemplate(id, d)` → success: replace ด้วย row จริงจาก server
4. fail → restore `prev` template (ทั้ง row เดิม) + toast

**Create path** (`editingTemplate === null`):
1. optimistic: append template id=`tmp-${Date.now()}` (active=true, userId="")
2. ยิง `createSubscriptionTemplate(d)` → success: replace temp ด้วย row จริง
3. fail → filter temp ออก + toast

### `handleToggleTemplateActive(id)`
- optimistic flip `active`
- ยิง `toggleSubscriptionTemplateActive(id, next)`
- fail → flip กลับ + toast

### `confirmDeleteTemplate()`
1. กดปุ่มลบ → `setPendingDeleteTemplateId(id)`
2. `<AlertDialog>` เปิด: "ลบ '{name}' ออกจากรายการสมัคร **รายการที่เคยดึงเข้าเดือนแล้วจะไม่ถูกลบ**"
3. Confirm → filter ออก (clear pendingDeleteTemplateId) + ยิง `deleteSubscriptionTemplate(id)`
4. fail → push prev กลับ + toast

> ledger rows orphan หลังลบ → ดู [overview cross-tab logic #4](./subscription.md#logic-cross-tab)

## TemplateDialog (`template-dialog.tsx`)

ฟิลด์:
| ฟิลด์ | type | required | หมายเหตุ |
|---|---|---|---|
| ชื่อบริการ | text | ✓ | autoFocus |
| จำนวนเงิน | number | ✓ | **required** (ไม่ใช่ optional แบบ monthly-cost) — `>= 0`, ทศนิยม 2 |
| หมวดหมู่ | Select | ✓ | `MOCK_CATEGORIES` (Streaming/Music/Software/อื่นๆ) |
| รูปแบบ | Select | ✓ | "รายเดือน" / "รายปี" — default `monthly` |
| วันต่ออายุ / วันตัดเงิน | DatePicker (shadcn) | — | default = `todayIso()` ตอนเปิด dialog |

`TemplateDraft`:
```ts
{
  name: string
  categoryId: string
  defaultAmount: string         // required, "n.toFixed(2)" format
  billingCycle: 'monthly' | 'yearly'
  renewDate: string | null      // "YYYY-MM-DD" หรือ null
}
```

หัวข้อ dialog เปลี่ยนตาม mode:
- create → "เพิ่มบริการ"
- edit (`initial` ไม่ null) → "แก้ไขบริการ"

Label ของ DatePicker เปลี่ยนตาม cycle:
- monthly → "วันตัดเงิน (ใช้แสดงในรายการ)"
- yearly → "วันต่ออายุ (banner จะโผล่เฉพาะเดือนต่ออายุ)"

> **DatePicker** ใช้ component `@/components/ui/date-picker` (ของ shadcn) — รับ/คืน `string | null` format `YYYY-MM-DD`

## Server actions ที่ใช้

`src/server/actions/subscription-templates.ts` — ทุกตัว `revalidatePath('/subscription')`

| Action | คำอธิบาย |
|---|---|
| `createSubscriptionTemplate(input)` | insert ทั้ง upsert payload + return row |
| `updateSubscriptionTemplate(id, input)` | update full payload (name/categoryId/defaultAmount/billingCycle/renewDate) + updatedAt |
| `toggleSubscriptionTemplateActive(id, active)` | update เฉพาะ active + updatedAt |
| `deleteSubscriptionTemplate(id)` | DELETE — ไม่ลบ ledger rows |

ทุกตัว validate ด้วย zod:
- `name` trim, 1-120 chars
- `defaultAmount` regex `/^\d+(\.\d{1,2})?$/`
- `billingCycle` enum check
- `renewDate` regex `/^\d{4}-\d{2}-\d{2}$/` หรือ null
- `id` uuid
- filter `userId` กับ `id` ใน WHERE

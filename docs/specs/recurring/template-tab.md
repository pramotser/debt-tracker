# Template Tab — ตั้งค่ารายการประจำ

> ดู overview ก่อน: [`recurring.md`](./recurring.md)

`tab value = "tpl"` · files:
- `src/features/recurring/template-view.tsx` — list (Active / Inactive sections) + row
- `src/features/recurring/template-dialog.tsx` — `<TemplateDialog>` create/edit

## วัตถุประสงค์

CRUD `recurring_templates` — template ที่นี่คือ source ของ banner + ImportModal ใน month-tab (ดึงเข้าเดือนซ้ำ ๆ)

## Layout

```
┌──────────────────────────────────────────────────────────┐
│ ตั้งค่ารายการประจำ                              [+ เพิ่ม]   │
├──────────────────────────────────────────────────────────┤
│ ACTIVE (N)                                                │
│ ⬤ ค่าไฟ        [รายเดือน][หมวด] ตัดเงินทุกวันที่ 5   กรอกทีหลัง ⋯ │
│ ⬤ Netflix      [รายเดือน][หมวด] ตัดเงินทุกวันที่ 1   ฿349    ⋯ │
│ INACTIVE (N)                                              │
│ ⬤ ...   (opacity 50%)                                     │
└──────────────────────────────────────────────────────────┘
```

แยกเป็น 2 section: **Active** + **Inactive (count)** · inactive row `opacity-50`

## Row (`TemplateRow`)

- `Switch` active (emerald = on / rose = off) → `onToggleActive` → `toggleRecurringTemplateActive`
- ชื่อ template
- `CycleBadge`: **รายปี** (amber) / **รายเดือน** (blue)
- `CategoryBadge` (จาก DB categories · lookup `categoryById`)
- `renewLabel` (`formatRenew`) — monthly = "ตัดเงินทุกวันที่ X" · yearly = วัน+เดือน-ไทย
- `defaultAmount` (ขวา) — `formatMoney` · `null` → "กรอกทีหลัง" (muted)
- Dropdown "เมนู" (`MoreHorizontal`) → **แก้ไข** (`onEdit`) · **ลบ** (`onDelete`, destructive)

**Empty state:** "ยังไม่มี..." + ปุ่ม `เพิ่ม`

## TemplateDialog (`template-dialog.tsx`)

| ฟิลด์ | type | required | หมายเหตุ |
|---|---|---|---|
| ชื่อรายการ | text | ✓ | placeholder "เช่น ค่าน้ำ ค่าไฟ Netflix" · autoFocus |
| จำนวนเงิน | number | — | placeholder "เว้นว่างได้ (กรอกทีหลัง)" · null ได้ · helper "เว้นว่าง = กรอกตอนดึงเข้าเดือน (เช่นค่าไฟที่ยอดไม่คงที่)" |
| หมวดหมู่ | CategoryPicker | ✓ | จาก DB `categories` |
| รูปแบบ | Select | ✓ | `รายเดือน` (monthly) / `รายปี` (yearly) · default monthly |
| วันตัดเงิน / วันต่ออายุ | DatePicker | — | label เปลี่ยนตาม cycle (monthly = "วันตัดเงิน" · yearly = "วันต่ออายุ") · default `todayIso()` · เก็บเป็น `renewDate` (YYYY-MM-DD) |

หัวข้อ dialog: create → "เพิ่มรายการประจำ" · edit (`initial` ไม่ null) → "แก้ไขรายการประจำ"

Submit → `RecurringTemplateDraft`:
```ts
{
  name: string;
  categoryId: string;
  defaultAmount: string | null;
  billingCycle: "monthly" | "yearly";
  renewDate: string | null;   // "YYYY-MM-DD"
}
```

## Mutations (optimistic + rollback)

| Handler | Server action | optimistic |
|---|---|---|
| `handleSubmitTemplate` (create) | `createRecurringTemplate` | append temp row → swap |
| `handleSubmitTemplate` (edit) | `updateRecurringTemplate(id, d)` | map field ทันที → restore ถ้า fail |
| `handleToggleTemplateActive` | `toggleRecurringTemplateActive(id, next)` | flip active |
| `confirmDeleteTemplate` | `deleteRecurringTemplate(id)` | filter ออก → push กลับถ้า fail |

> แก้ `defaultAmount` ของ template = ทำผ่าน TemplateDialog (full edit) หรือผ่าน 3-way "อัปเดต template ด้วย" จาก month-tab (`updateRecurringTemplateDefaultAmount`) — ไม่มี inline edit บน template row
> ลบ template = `AlertDialog` confirm: "ลบ '{name}' ออกจากรายการประจำ · รายการที่เคยดึงเข้าเดือนแล้วจะไม่ถูกลบ" (ledger orphan ปลอดภัย)

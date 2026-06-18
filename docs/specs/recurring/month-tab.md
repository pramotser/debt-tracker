# Month Tab — รายการเดือนนี้

> ดู overview ก่อน: [`recurring.md`](./recurring.md)

`tab value = "month"` (default) · files:
- `src/features/recurring/month-view.tsx` — summary + list + banner + month nav
- `src/features/recurring/item-dialog.tsx` — `<AddItemDialog>` (เพิ่มรายการครั้งเดียว)
- `src/features/recurring/import-modal.tsx` — `<ImportModal>` (ดึง template เข้าเดือน)

## Layout

```
┌──────────────────────────────────────────────────────────┐
│ [‹ เดือนก่อน]   YYYY/MM   [เดือนถัดไป ›]      [+ เพิ่มรายการ] │
├──────────────────────────────────────────────────────────┤
│  ยอดรวม         จ่ายแล้ว         ค้างจ่าย        [จ่ายแล้ว 60%]  │
│  ฿X,XXX         ฿X (N รายการ)   ฿X (N รายการ)   ▓▓▓▓░░ N/N    │
├──────────────────────────────────────────────────────────┤
│ ⓘ มีรายการประจำ active N รายการ ยังไม่ได้ดึงเข้าเดือนนี้  [ข้าม][ดึงรายการ] │
├──────────────────────────────────────────────────────────┤
│ ☑ ชื่อรายการ        [CycleBadge] [StatusBadge]   ฿amount   🗑️ │
│ ☐ ค่าไฟ            [รายเดือน]   [ค้างจ่าย]      แตะเพื่อกรอก  🗑️ │
│ ...                                                       │
└──────────────────────────────────────────────────────────┘
```

## Month nav

- `[‹ เดือนก่อน]` / `[เดือนถัดไป ›]` → `navigateMonth(-1 / +1)` · label `YYYY/MM` ผ่าน `formatYearMonth`
- เปลี่ยนเดือน = อ่าน `monthCacheRef` ก่อน · ไม่มีใน cache → `fetchRecurringEntriesByMonth` (loading state ระหว่างรอ)

## Summary (KPI)

| ช่อง | ค่า |
|---|---|
| ยอดรวม | sum ของ `amount` ทุก row (null = 0) |
| จ่ายแล้ว | sum `amount` ของ row ที่ `paid` + hint `{paidCount} รายการ` |
| ค้างจ่าย | `total − paidSum` + hint `{items − paidCount} รายการ` |
| Progress | `paidCount / items` % + bar — "จ่ายแล้ว X%" · "N / N รายการ" |

> ถ้าไม่มี item → ไม่แสดง progress (กัน NaN)

## Import banner

- แสดงเมื่อ `!loading && !bannerDismissed && pendingTemplates.length > 0`
- ข้อความ: **"มีรายการประจำ active {N} รายการ ยังไม่ได้ดึงเข้าเดือนนี้"** · ปุ่ม `[ข้าม]` (dismiss เดือนนี้, client-only) · `[ดึงรายการ]` (เปิด ImportModal)
- สี: `border-blue-200 bg-blue-50` + icon `Info`

## รายการ (row)

แต่ละ row:
- `Checkbox` paid → `onTogglePaid` (optimistic flip)
- ชื่อรายการ (paid → `line-through` + opacity) + `CycleBadge` (lookup `templatesById.get(sourceId)` · null = "เพิ่มเอง")
- `StatusBadge` `paid` / `due`
- amount — `formatMoney` · `null` → ปุ่ม "แตะเพื่อกรอก" (สีส้ม) เปิด inline edit
- ปุ่ม "ลบรายการ" (🗑️) → `pendingDeleteLedgerId` → AlertDialog confirm

**Empty state:** "ยังไม่มี..." + ปุ่ม `ดึงรายการ` / `เพิ่มรายการ`

## แก้ยอด (inline) → 3-way confirm

แตะ amount → กรอกใหม่ → `onRequestEditAmount`:
- ถ้า row มาจาก template ที่ **ตั้งยอดไว้** (`templateHasAmount`) → เปิด dialog **"แก้ยอดเดือนนี้ — อัปเดต template ด้วยมั้ย?"**
  - `[แก้เฉพาะเดือนนี้]` → `updateRecurringAmount` (ledger เท่านั้น)
  - `[อัปเดต template ด้วย]` → `updateRecurringAmount` + `updateRecurringTemplateDefaultAmount`
  - `[ยกเลิก]`
- ถ้า template ไม่ตั้งยอด / เป็น one-time → `commitLedgerAmount` ทันที (ไม่ถาม)

## AddItemDialog (`item-dialog.tsx`)

| ฟิลด์ | type | required | หมายเหตุ |
|---|---|---|---|
| ชื่อรายการ | text | ✓ | placeholder "เช่น ค่าข้าว ค่าหมอ" |
| จำนวนเงิน | number | — | `0.00` · null ได้ |
| หมวดหมู่ | CategoryPicker | ✓ | จาก DB `categories` |

Submit → `createOneTimeEntry` (`type=ONE_TIME_COST`, source = null) · optimistic append (temp id → swap หลัง await)

## ImportModal (`import-modal.tsx`)

- หัวข้อ + คำอธิบาย "เลือกรายการที่ต้องการบันทึกลง — แก้ไขจำนวนได้ภายหลัง"
- filter ตามรอบ: `ทั้งหมด` / `รายเดือน` / `รายปี`
- `[เลือกทั้งหมด]` / `[ล้างทั้งหมด]` · default auto-check ทุกอัน
- ปุ่ม `ดึง` → `importRecurringToMonth(ids, y, m)` · server dedupe ด้วย sourceId

## Mutations (optimistic + rollback)

| Handler | Server action | optimistic |
|---|---|---|
| `handleTogglePaid` | `toggleRecurringPaid` | flip paid + paidAt |
| `commitLedgerAmount` | `updateRecurringAmount` | set amount |
| `handleAddItem` | `createOneTimeEntry` | append temp row → swap |
| `handleImport` | `importRecurringToMonth` | append rows ที่ server คืน |
| `confirmDeleteLedger` | `deleteRecurringLedger` | filter row ออก → push กลับถ้า fail |

> ทุก action (ยกเว้น `fetchRecurringEntriesByMonth`) `revalidatePath('/recurring')` · ฝั่ง client เก็บ month cache เอง

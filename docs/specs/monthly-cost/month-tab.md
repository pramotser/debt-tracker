# Month Tab — รายการจ่ายรายเดือน

> ดู overview ก่อน: [`monthly-cost.md`](./monthly-cost.md)

`tab value = "month"` (default tab) · file: `src/features/monthly-cost/month-view.tsx` (state อยู่ที่ `monthly-cost-app.tsx`)

## วัตถุประสงค์

ดูและจัดการ ledger entries รายเดือน (`FIXED_COST` ที่ดึงจาก template + `ONE_TIME_COST` ที่เพิ่มเอง) — เห็นยอดรวม/จ่ายแล้ว/ค้าง แบบสด

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ◀  มิถุนายน 2026  ▶                          [ + เพิ่มรายการ ] │
├─────────────────────────────────────────────────────────────────┤
│  ยอดรวม      จ่ายแล้ว(เขียว)    ค้างจ่าย(ส้ม)    จ่ายแล้ว 2/5  │
│  ฿8,500.00   ฿3,200.00          ฿5,300.00                       │
├─────────────────────────────────────────────────────────────────┤
│ ℹ️ มีรายการจ่ายประจำ active 3 รายการ ยังไม่ดึงเข้าเดือนนี้      │
│                                          [ ข้าม ] [ ดึงรายการ ] │
├─────────────────────────────────────────────────────────────────┤
│ [☐] ค่าเช่าบ้าน        [ครอบครัว]           ฿8,000.00    [🗑] │
│ [☑] ค่าน้ำค่าไฟ        [ค่าน้ำค่าไฟ]        ฿320.00      [🗑] │
│ [☐] Starbucks         [อื่นๆ]              แตะเพื่อกรอก  [🗑] │
└─────────────────────────────────────────────────────────────────┘
```

### Month navigator
- เปลี่ยนเดือนได้อิสระ (อดีต/อนาคต)
- update URL ผ่าน `window.history.replaceState(null, "", "?y=&m=")` (ไม่ trigger router)

### Header actions
- ปุ่ม `[ + เพิ่มรายการ ]` (right) → เปิด `<AddItemDialog>`

### Summary card (แถวเดียวแนวนอน)
ใช้ `Card flex-row! flex-wrap items-center` — ไม่ใช่ default `flex-col` ของ Card

ฟิลด์:
- "ยอดรวม" — `formatMoney(total)`
- "จ่ายแล้ว" — `formatMoney(paidSum)` สี `text-emerald-600`
- "ค้างจ่าย" — `formatMoney(total - paidSum)` สี `text-orange-600`
- "จ่ายแล้ว X/Y รายการ" — `paidCount/items.length`

> คำนวณฝั่ง client จาก `entries` ทันที (ไม่ต้อง roundtrip)

### Pending banner (เงื่อนไข)
แสดงเมื่อ:
```ts
!bannerDismissed && pendingTemplates.length > 0
```

- icon `<Info>` สีฟ้า · พื้น `bg-blue-50/60`
- ข้อความ: "มีรายการจ่ายประจำ active **N** รายการ ยังไม่ได้ดึงเข้าเดือนนี้"
- ปุ่ม `[ ข้าม ]` (ghost) → push `ymKey(y,m)` เข้า `dismissedMonths` set (client-only, ไม่ persist)
- ปุ่ม `[ ดึงรายการ ]` → เปิด `<ImportModal>`

### Empty state
ถ้า `items.length === 0`:
- "ยังไม่มีรายการเดือนนี้ — กด 'ดึงรายการ' ด้านบนหรือ 'เพิ่มรายการ'" (ถ้ามี pending)
- "ยังไม่มีรายการเดือนนี้ — กด 'เพิ่มรายการ'" (ถ้าไม่มี pending)

### ItemRow (Card ต่อ row)
- Checkbox paid (toggle)
- ชื่อ + `<CategoryBadge>`
- `paid` → `opacity-60` ทั้ง card + `line-through` ที่ชื่อ + amount
- ยอดเงิน:
  - `amount === null` → ปุ่ม "แตะเพื่อกรอก" สี `text-orange-600`
  - มีค่า → ปุ่ม `formatMoney(amount)` ที่กดได้
  - inline edit: Input type=number → Enter/blur commit, Esc cancel
  - commit: empty → `null` · มีค่า → `n.toFixed(2)` (ถ้า NaN → `null`)
- ปุ่มลบ (Trash icon, hover แดง) → ลบทันที **ไม่มี confirm**

## State & client logic

### Month navigation flow (เหมือน statement-tab ของ credit-cards)
1. `shiftMonth(ym, delta)` คำนวณเดือนถัดไป
2. `setYm(next)` + `window.history.replaceState`
3. cached → `setEntries(cached)`
4. ไม่มี cache → `setEntries([])` + ยิง `fetchFixCostEntriesByMonth(y, m)` ใน `useTransition`
5. ใช้ `ymRef.current` กัน race ก่อน setEntries

### Sync ใน `mutateCurrentMonth`
ทุก update ของ entries เดือนปัจจุบัน ผ่าน helper:
```ts
mutateCurrentMonth((prev) => updater(prev))
// 1. setEntries(next)
// 2. monthCacheRef.current.set(ymKey(y,m), next)  ← sync cache เสมอ
```

## Mutations (optimistic + rollback)

| Handler | Server action | Optimistic | Rollback |
|---|---|---|---|
| `handleTogglePaid(id)` | `toggleLedgerEntryPaid(id, next)` | flip paid + paidAt ใน entries + cache | flip กลับ + toast.error |
| `handleUpdateAmount(id, amt)` | `updateLedgerEntryAmount(id, amt)` | set amount (string \| null) | restore prev.amount + toast |
| `handleDeleteEntry(id)` | `deleteLedgerEntry(id)` | filter out | push prev กลับ + toast |
| `submitItem(d)` | `createLedgerEntry({name, categoryId, amount, y, m})` | insert temp row id=`tmp-${Date.now()}` ทันที | filter temp ออก + toast — success: replace temp ด้วย row จริงจาก server |
| `handleImport(ids)` | `importFixCostTemplatesToMonth(ids, y, m)` | (post-await) append rows ที่ server ส่งกลับ | ไม่ rollback (UI ยังว่าง) — toast.error |

### `submitItem` กับ "บันทึกเป็น template"
หลังสร้าง ledger row → check:
```ts
if (d.saveAsTemplate) {
  const exists = templates.some(t => normalize(t.name) === normalize(d.name))
  if (!exists) persistNewTemplate({ name, categoryId, defaultAmount: amount })
}
// normalize = trim().toLocaleLowerCase('th')
```

> `persistNewTemplate` แยกออกมา reuse กับ tab 2 — optimistic insert temp template (id=`tmp-${Date.now()}`) → replace ด้วย row จริง

## Queries / Actions ที่ใช้

| ใช้เมื่อ | Function | ไฟล์ |
|---|---|---|
| SSR เดือนแรก | `listFixCostEntriesByMonth(y, m)` | `server/queries/ledger-entries.ts` |
| เปลี่ยนเดือน (client) | `fetchFixCostEntriesByMonth(y, m)` | `server/actions/ledger-entries.ts` |
| Import เข้าเดือน | `importFixCostTemplatesToMonth(ids, y, m)` | `server/actions/ledger-entries.ts` |
| สร้าง one-time | `createLedgerEntry(input)` | `server/actions/ledger-entries.ts` |

ทั้งคู่ query/action filter `type IN ('FIXED_COST', 'ONE_TIME_COST')` (เฉพาะ SELECT) เพื่อตัด CREDIT_CARD/SUBSCRIPTION ออก

## AddItemDialog (`item-dialog.tsx`)

ฟิลด์:
| ฟิลด์ | type | required | หมายเหตุ |
|---|---|---|---|
| ชื่อรายการ | text | ✓ | autoFocus, `trim().length > 0` |
| จำนวนเงิน | number | — | optional · empty → `null` · `n.toFixed(2)` (NaN → `null`) |
| หมวดหมู่ | Select | ✓ | `MOCK_CATEGORIES`, default = `categories[0]` |
| บันทึกเป็น template ด้วย | Checkbox | — | default `false` |

`ItemDraft`:
```ts
{ name: string; amount: string | null; categoryId: string; saveAsTemplate: boolean }
```

## ImportModal (`import-modal.tsx`)

- title: "ดึงรายการจ่ายประจำเข้าเดือน YYYY/MM"
- list `pendingTemplates` (จาก orchestrator — derive แล้ว) ใน `<ScrollArea max-h-[50vh]>`
- ทุก row: checkbox + ชื่อ + `<CategoryBadge>` + ยอด (`formatMoney(defaultAmount)` หรือ `—`)
- **default = auto-check ทุกอัน** (`useEffect: setSelected(new Set(pendingTemplates.map(t => t.id)))` ตอน open)
- ปุ่ม submit: "ดึงเข้ารายการ (N)" (N = `selected.size`) · disabled ถ้า N = 0
- กดปุ่ม → `onSubmit(Array.from(selected))` → orchestrator เรียก `handleImport(ids)`

> ไม่มี dialog confirm "แทนที่" — server dedupe เอง (skip template ที่มี ledger sourceId ตรงในเดือนนั้น) — ดู [overview](./monthly-cost.md#logic-cross-tab)

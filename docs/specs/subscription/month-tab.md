# Month Tab — รายการจ่ายรายเดือน

> ดู overview ก่อน: [`subscription.md`](./subscription.md)

`tab value = "month"` (default tab) · file: `src/features/subscription/month-view.tsx` (state อยู่ที่ `subscription-app.tsx`)

## วัตถุประสงค์

ดูยอด subscription ที่ต้องจ่ายในเดือนนั้น — รายการเข้ามาจาก "ดึง template เข้าเดือน" (ไม่มี flow เพิ่ม manual)

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ◀  มิถุนายน 2026  ▶                                             │
├─────────────────────────────────────────────────────────────────┤
│  ยอดรวม      จ่ายแล้ว(เขียว)    ค้างจ่าย(ส้ม)    จ่ายแล้ว 1/3  │
│  ฿969.00     ฿201.00            ฿768.00                         │
├─────────────────────────────────────────────────────────────────┤
│ ℹ️ มีรายการสมัคร active 2 รายการ ยังไม่ดึงเข้าเดือนนี้          │
│                                          [ ข้าม ] [ ดึงรายการ ] │
├─────────────────────────────────────────────────────────────────┤
│ [☑] Netflix          [รายเดือน] [Streaming]      ฿201.00  [🗑] │
│ [☐] Spotify          [รายเดือน] [Music]          ฿119.00  [🗑] │
│ [☐] ChatGPT Plus     [รายปี]    [Software/AI]    ฿649.00  [🗑] │
└─────────────────────────────────────────────────────────────────┘
```

### Month navigator
- เปลี่ยนเดือนได้อิสระ (อดีต/อนาคต)
- update URL ผ่าน `window.history.replaceState(null, "", "?y=&m=")`
- **ไม่มีปุ่ม "เพิ่มรายการ"** ใน toolbar (ต่างจาก monthly-cost)

### Summary card (แถวเดียวแนวนอน)
ใช้ `Card flex-row! flex-wrap items-center` — เหมือน monthly-cost

ฟิลด์:
- "ยอดรวม" — `formatMoney(total)`
- "จ่ายแล้ว" — `formatMoney(paidSum)` สี `text-emerald-600`
- "ค้างจ่าย" — `formatMoney(total - paidSum)` สี `text-orange-600`
- "จ่ายแล้ว X/Y รายการ"

### Pending banner (เงื่อนไข)
แสดงเมื่อ:
```ts
!bannerDismissed && pendingTemplates.length > 0
```

- icon `<Info>` สีฟ้า · พื้น `bg-blue-50/60`
- ข้อความ: "มีรายการสมัคร active **N** รายการ ยังไม่ได้ดึงเข้าเดือนนี้"
- ปุ่ม `[ ข้าม ]` (ghost) → push เข้า `dismissedMonths` set
- ปุ่ม `[ ดึงรายการ ]` → เปิด `<ImportModal>`

> ดู logic `pendingTemplates` filter ใน [overview](./subscription.md#pending-templates-derive-ใน-client) — yearly ต้องตรงเดือนต่ออายุ

### Empty state
ถ้า `items.length === 0`:
- "ยังไม่มีรายการเดือนนี้ — กด 'ดึงรายการ' ด้านบนเพื่อนำเข้าจาก template" (ถ้ามี pending)
- "ยังไม่มีรายการเดือนนี้ — เพิ่ม template ในแท็บ 'รายการสมัคร' ก่อน" (ถ้าไม่มี pending)

### ItemRow (Card ต่อ row)
- Checkbox paid (toggle)
- ชื่อ + **CycleBadge** (รายเดือน/รายปี/เพิ่มเอง) + `<CategoryBadge>`
- `paid` → `opacity-60` ทั้ง card + `line-through` ที่ชื่อ + amount
- ยอดเงิน:
  - `amount === null` → แสดง "—" (ไม่ใช่ "แตะเพื่อกรอก" แบบ monthly-cost)
  - มีค่า → ปุ่ม `formatMoney(amount)` ที่กดได้
  - inline edit: Input → Enter/blur commit, Esc cancel
  - commit: trimmed empty → **ไม่ส่ง** (ปิด editing อย่างเดียว) · `n >= 0` → `n.toFixed(2)` · NaN/negative → ไม่ส่ง
- ปุ่มลบ (Trash icon, hover แดง) → set `pendingDeleteLedgerId` → เปิด `<AlertDialog>` confirm

> **CycleBadge logic** (ถ้า template ของ row นั้นถูกลบไปแล้ว = orphan):
> - `template === null` → "เพิ่มเอง" (gray)
> - `template.billingCycle === 'yearly'` → "รายปี" (amber)
> - `template.billingCycle === 'monthly'` → "รายเดือน" (blue)

## State & client logic

### Month navigation flow
1. `shiftMonth(ym, delta)` คำนวณเดือนถัดไป
2. `setYm(next)` + `window.history.replaceState`
3. cached → `setEntries(cached)`
4. ไม่มี cache → `setEntries([])` + ยิง `fetchSubscriptionEntriesByMonth(y, m)` ใน `useTransition`
5. ใช้ `ymRef.current` กัน race ก่อน setEntries

### Sync ใน `mutateCurrentMonth`
```ts
setEntries(next) + monthCacheRef.set(ymKey, next)
```

## Mutations (optimistic + rollback)

| Handler | Server action | Optimistic | Rollback |
|---|---|---|---|
| `handleTogglePaid(id)` | `toggleSubscriptionPaid(id, next)` | flip paid + paidAt | flip กลับ + toast.error |
| `handleUpdateAmount(id, amt)` | `updateSubscriptionAmount(id, amt)` | set amount (string) | restore prev.amount + toast |
| `confirmDeleteLedger()` | `deleteSubscriptionLedger(id)` | filter out (clear `pendingDeleteLedgerId`) | push prev กลับ + toast |
| `handleImport(ids)` | `importSubscriptionsToMonth(ids, y, m)` | (post-await) append rows | ไม่ rollback — toast.error |

### Delete confirm flow
1. กดปุ่มลบ → `setPendingDeleteLedgerId(id)`
2. `<AlertDialog>` เปิดอัตโนมัติ (open = `pendingDeleteLedgerId !== null`)
3. Body: "ลบ '{name}' ออกจากเดือนนี้"
4. Confirm → `confirmDeleteLedger()` (optimistic remove + ยิง action)
5. fail → push prev กลับ + toast

> ⚠️ ต่างจาก monthly-cost ที่ลบ ledger ทันที (ไม่ confirm) — subscription มี confirm dialog เสมอ

## Queries / Actions ที่ใช้

| ใช้เมื่อ | Function | ไฟล์ |
|---|---|---|
| SSR เดือนแรก | `listSubscriptionEntriesByMonth(y, m)` | `server/queries/ledger-entries.ts` |
| เปลี่ยนเดือน (client) | `fetchSubscriptionEntriesByMonth(y, m)` | `server/actions/subscription-ledger.ts` |
| Import เข้าเดือน | `importSubscriptionsToMonth(ids, y, m)` | `server/actions/subscription-ledger.ts` |

ทั้งหมด filter `type='SUBSCRIPTION'` เพื่อตัดประเภทอื่นออก

## ImportModal (`import-modal.tsx`)

- title: "ดึงรายการสมัครเข้าเดือน YYYY/MM"
- list `pendingTemplates` (จาก orchestrator — derive แล้ว) ใน `<ScrollArea max-h-[50vh]>`
- ทุก row: checkbox + ชื่อ + **CycleBadge** (รายเดือน/รายปี) + ยอด `formatMoney(defaultAmount)`
- **default = auto-check ทุกอัน** (`useEffect: setSelected(new Set(pendingTemplates.map(t => t.id)))` ตอน open)
- ปุ่ม submit: "ดึงเข้ารายการ (N)" · disabled ถ้า N = 0
- กดปุ่ม → `onSubmit(Array.from(selected))` → orchestrator เรียก `handleImport(ids)`

> ImportModal ของ subscription **ไม่แสดง CategoryBadge** ใน label row (ต่างจาก monthly-cost) — แสดงแค่ CycleBadge

# Installment Tab — รายการผ่อนชำระ

> ดู overview ก่อน: [`credit-cards.md`](./credit-cards.md)

`tab value = "installment"` · file: `src/features/credit-cards/tabs/installment-tab.tsx` + `installment-view.tsx` + `plan-card.tsx`

## วัตถุประสงค์

ดูภาพรวมแผนผ่อนทุกแผนของ user — **ไม่ผูกกับ month navigator** เพื่อมอนิเตอร์ภาระหนี้คงเหลือทั้งหมดข้ามเดือน

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ℹ️  แท็บนี้แสดงแผนผ่อนระยะยาวทั้งหมดที่คุณมี ไม่ขึ้นตรงกับ      │
│    การเลื่อนดูรายเดือน เพื่อมอนิเตอร์ภาพรวมของหนี้ปัจจุบัน        │
├─────────────────────────────────────────────────────────────────┤
│                                          [ + เพิ่มแผนผ่อน ]    │
├─ กำลังผ่อน ────────────────────────────────────────────────────┤
│ ┌─ iPad Pro  [อิเล็กทรอนิกส์]              ● ACTIVE  [⋯] ─┐    │
│ │ UOB Premier (****1234)                                  │    │
│ │ ยอดรวม        ฿33,860.00                                │    │
│ │ คงเหลือ       ฿23,702.00                                │    │
│ │ ค่างวด        ฿3,386.00 / เดือน                         │    │
│ │ [▓▓▓▓▓░░░░░░░░░] 3/10                                   │    │
│ │ งวด 3 / 10                  คาดว่าจะจบ : 2027/03         │    │
│ │ [⌄ ดูรายงวด]                                             │    │
│ └─────────────────────────────────────────────────────────┘    │
├─ ใกล้จบ ───────────────────────────────────────────────────────┤
│ ...                                                              │
├─ ผ่อนครบแล้ว ──────────────────────────────────────────────────┤
│ ...                                                              │
├─ ปิดก่อนกำหนด ─────────────────────────────────────────────────┤
│ ...                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Helper alert (เสมอ)
`<Alert>` ที่ด้านบนสุด: "แท็บนี้แสดงแผนผ่อนระยะยาวทั้งหมดที่คุณมี ไม่ขึ้นตรงกับการเลื่อนดูรายเดือน เพื่อมอนิเตอร์ภาพรวมของหนี้ปัจจุบัน"

### Button "+ เพิ่มแผนผ่อน"
- align right
- disabled ถ้า `cards.length === 0` (ไม่มีบัตรเลย — แม้ inactive)
- เปิด `<PlanDialog>` ที่ filter cards ด้วย `c.active`

### Sections (เฉพาะที่มี plan)
แสดงเป็น `<Section title>` เฉพาะ bucket ที่มีอย่างน้อย 1 plan:
1. **กำลังผ่อน** — `uiStatus === 'active'`
2. **ใกล้จบ** — `uiStatus === 'near-end'`
3. **ผ่อนครบแล้ว** — `uiStatus === 'completed'`
4. **ปิดก่อนกำหนด** — `uiStatus === 'early-settlement'`

ถ้า `plans.length === 0` → empty card "ยังไม่มีแผนผ่อน — กด 'เพิ่มแผนผ่อน' เพื่อเริ่ม"

> **ไม่มี summary cards 4 ใบ** (เดือนนี้ต้องจ่าย/ยอดคงเหลือรวม/กำลังผ่อน/ใกล้จบ) — feature นี้ยังไม่ทำ

## UiStatus derivation

`installment-view.tsx::uiStatusOf(plan: InstallmentPlanWithProgress)`:

```ts
if (plan.status === "early_settled") return "early-settlement";
if (plan.paidCount >= plan.totalInstallments) return "completed";
if (plan.totalInstallments - plan.paidCount <= 1) return "near-end";
return "active";
```

> DB enum `installment_status` มีแค่ `active | early_settled` · `completed` กับ `near-end` derive จาก `paidCount` (มาจาก SQL aggregate `COALESCE(SUM(CASE WHEN paid THEN 1 ELSE 0 END), 0)::int`)

## PlanCard rendering (`plan-card.tsx`)

### Header (ทุก state)
- ชื่อแผน + `<CategoryBadge>` + ขวา: `<StatusBadge>` (ACTIVE / NEAR END / COMPLETED / EARLY SETTLEMENT)
- subtitle: `cardName (****XXXX)`
- Dropdown menu (⋯) — **แสดงเฉพาะ active/near-end** (`isOpenForActions = !isCompleted && !isEarly`):
  - "ปิดยอดก่อนกำหนด" → เปิด `<SettleDialog>`
  - "ลบแผน" → เปิด `<AlertDialog>` confirm

### Body (variant ตาม status)
- **completed** → "ผ่อนครบ X/N งวด" บรรทัดเดียว
- **early-settlement** → "ยอดปิดก่อนกำหนด + ปิดเมื่อ (locale th-TH)"
- **active / near-end** →
  - Row: ยอดรวม / คงเหลือ / ค่างวด-เดือน
  - Progress bar (h-2.5)
  - งวด `X / N` (ถ้า near-end เพิ่ม "เหลืออีก X งวด" สีส้ม)
  - "คาดว่าจะจบ : YYYY/MM" — คำนวณจาก `lastEntry` (งวด unpaid สุดท้าย หรือ fallback ไปงวดสุดท้าย)

### "ดูรายงวด" expand
- toggle button → reveal period table

## EntryRow (drilldown รายงวด)

ต่อ row:
- Checkbox paid + label `YYYY/MM`
- Middle area (เปลี่ยนตาม state):
  - `hasInterest && principalAmount !== null` → "ต้น X + ดอก Y"
  - else → note (ถ้ามี) เช่น "ปิดก่อนกำหนด"
- ปุ่ม "กรอกต้น/ดอก" (สีส้ม) — แสดงเฉพาะ:
  ```
  hasInterest === true && !entry.paid && entry.principalAmount === null
  ```
  (= mode 3 "split รู้ทีหลัง" + ยังไม่จ่าย)
- ตัวเลขยอดงวด (right)
- paid → `opacity-60` + `line-through`

### Inline split editor (กดปุ่ม "กรอกต้น/ดอก")
- 2 input (เงินต้น + ดอกเบี้ย)
- commit on Enter/blur → `onUpdateInterestSplit(p.toFixed(2), i.toFixed(2))`
- Escape → cancel
- **invariant**: `amount = principal + interest` (server คำนวณ `total = (Number(p) + Number(i)).toFixed(2)`)

## PlanDialog (`plan-dialog.tsx`)

ฟิลด์:
| ฟิลด์ | type | required |
|---|---|---|
| บัตรเครดิต | Select | ✓ จาก `cards.filter(active)` |
| ชื่อแผน | text | ✓ |
| หมวดหมู่ | Select | ✓ `MOCK_CATEGORIES` |
| ยอดรวม | number | ✓ |
| ค่างวด/เดือน | number | ✓ |
| จำนวนงวด | number (1-120) | ✓ default `10` |
| เริ่มปี | number (1970-9999) | ✓ default = year ปัจจุบัน |
| เริ่มเดือน | number (1-12) | ✓ default = month ปัจจุบัน |
| รูปแบบดอกเบี้ย | Select | ✓ — 3 mode |

### 3 modes ของดอกเบี้ย

| mode | UI | `hasInterest` | `installmentPrincipal` | `installmentInterest` |
|---|---|---|---|---|
| `zero` (default) | "ผ่อน 0%" | `false` | = `installmentAmount` | `"0.00"` |
| `known-split` | "มีดอกเบี้ย (รู้ split)" + 2 input (ต้น/ดอก) | `true` | = ค่าที่กรอก | = ค่าที่กรอก |
| `unknown-split` | "มีดอกเบี้ย (split รู้ทีหลัง)" | `true` | `null` | `null` |

> ค่า `installmentPrincipal` / `installmentInterest` ระดับ **plan** นี้ถูก copy ลงทุก ledger row งวด ตอน create plan
> mode 3 (`unknown-split`) → ledger row ที่ถูก insert มี `principalAmount = null` → drilldown จะแสดงปุ่ม "กรอกต้น/ดอก" เพื่อเติมรายงวด

## SettleDialog (`settle-dialog.tsx`)

ฟิลด์:
| ฟิลด์ | type | required |
|---|---|---|
| ยอดปิด | number (`≥0`) | ✓ |
| ปีที่ปิด | number (1970-9999) | ✓ default = year ปัจจุบัน |
| เดือนที่ปิด | number (1-12) | ✓ default = month ปัจจุบัน |

> หลัง submit → server ทำใน transaction: delete unpaid rows + insert "ปิดก่อนกำหนด" row 1 row (paid=true, paidAt=now, note='ปิดก่อนกำหนด') + flip plan to `early_settled`
> Client เรียก `router.refresh()` หลัง success เพื่อ sync state จาก server (paidCount/orphan rows)

## Delete plan flow

1. กด "ลบแผน" → `<AlertDialog>` "ลบ '{name}' และทุกงวดที่ยังไม่จ่าย — งวดที่จ่ายแล้วจะเก็บไว้ใน ledger"
2. Confirm → **optimistic**:
   - filter plan ออกจาก state
   - filter ledger entries `sourceId === planId && !paid` ออก
3. ยิง `deleteInstallmentPlan(id)` (transaction: delete unpaid ledger + delete plan)
4. fail → `toast.error` + `router.refresh()` (revert จาก server)

**paid rows จะ orphan** (มี `sourceId` แต่ไม่มี plan แล้ว) — code ปัจจุบันไม่ cleanup รอบ tab 1 อาจจะ lookup plan ไม่เจอ → cardOfEntry คืน undefined → ไม่ render row (ไม่โผล่ใน statement)

## Mutations (optimistic + rollback)

| Handler | Server action | optimistic | rollback |
|---|---|---|---|
| `handleCreatePlan` | `createInstallmentPlan` | (post-await) prepend plan + append N entries | ไม่มี (UI ไม่ optimistic) — แค่ toast.error |
| `handleTogglePaid` | `toggleInstallmentLedgerPaid` | flip paid + paidAt + อัพเดท `paidCount` ของ plan | revert ทั้งงวดและ paidCount |
| `handleUpdateInterestSplit` | `updateLedgerInterestSplit` | set principal/interest/amount = (p+i) | restore prev entry |
| `handleSettle` | `settleInstallmentEarly` | (post-await) `router.refresh()` | toast.error เท่านั้น |
| `confirmDeletePlan` | `deleteInstallmentPlan` | remove plan + unpaid entries | `router.refresh()` |

## Queries ที่ใช้

| Function | คำอธิบาย |
|---|---|
| `listInstallmentPlans()` | plan ทั้งหมด + JOIN ledger คำนวณ `paidCount` (SQL aggregate) |
| `listAllInstallmentEntries()` | ledger ทุก row ที่ `type='CREDIT_CARD_INSTALLMENT'` ของ user — client filter รายแผน |
| `listLedgerForPlan(planId)` | (มีฟังก์ชันใน queries แต่ tab นี้ไม่ได้ใช้ — Tab ใช้ entries จาก parent state) |
| `listUpcomingInstallments(limit)` | (มีแต่ tab นี้ไม่ได้ใช้ — ของ dashboard) |

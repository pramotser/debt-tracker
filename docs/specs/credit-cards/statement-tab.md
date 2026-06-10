# Statement Tab — รายการชำระบัตรเครดิต

> ดู overview ก่อน: [`credit-cards.md`](./credit-cards.md)

`tab value = "statement"` (default tab) · file: `src/features/credit-cards/tabs/statement-tab.tsx`

## วัตถุประสงค์

ดูยอดที่ต้องเตรียมจ่ายในเดือนนั้นต่อบัตร — รวม "การรูดเต็ม" + "งวดผ่อนที่ตกในเดือนนั้น" (tab ที่ใช้บ่อยที่สุด)

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ◀  มิถุนายน 2026  ▶                       [ + เพิ่มรายการรูด ] │
├─────────────────────────────────────────────────────────────────┤
│ [Card 1]  [Card 2]  [Card 3]  ...  (horizontal scroll)           │
│  ชื่อบัตร                                                       │
│  ****1234                                                       │
│  ยอดบิลเดือนนี้                                                 │
│  ฿X,XXX.00                                                      │
│  ครบกำหนด: ทุกวันที่ 28                                         │
├─────────────────────────────────────────────────────────────────┤
│ [☐] 🟡 ผ่อน   iPad Pro     UOB Premier     ฿3,386.00    [🗑]   │
│ [☐] 🟢 รูด    ค่าน้ำมัน    UOB Premier     ฿610.00      [🗑]   │
│ [☑] 🟢 รูด    Starbucks    KBank Live+     ฿180.00      [🗑]   │
└─────────────────────────────────────────────────────────────────┘
```

### Month navigator
- เปลี่ยนเดือนได้อิสระ (ไม่มี disabled · อดีต/อนาคต ก็ไปได้)
- default = `?y=&m=` จาก URL หรือเดือนปัจจุบัน (parse ใน page.tsx)
- กดเปลี่ยนเดือน → `window.history.replaceState(null, "", "?y=&m=")` (ไม่ trigger router)

### Credit card grid (horizontal scroll)
1 การ์ดต่อบัตร **active เท่านั้น** — ถ้าไม่มีบัตร active เลย → แสดง empty card ข้อความ "ยังไม่มีบัตร — สลับไปแท็บ 'บัตรของฉัน' เพื่อเพิ่มบัตรก่อน"

ต่อใบ:
- ชื่อบัตร
- เลข 4 ตัวท้าย `****XXXX` (หรือ `—`)
- "ยอดบิลเดือนนี้" + `formatMoney(sum)` — sum ของ ledger entries ที่ผูกกับบัตรในเดือนนั้น
- "ครบกำหนด: ทุกวันที่ X" (ถ้า `dueDate` มี)

> **ไม่มีฟิลด์วงเงิน/วงเงินคงเหลือ** — schema ไม่รองรับ

### Transaction list
ถ้า entries.length = 0 → empty state "ยังไม่มีรายการเดือนนี้"

ต่อ row:
- Checkbox paid (toggle ได้)
- Badge สี:
  - 🟢 `รูด` (CREDIT_CARD) — emerald
  - 🟡 `ผ่อน` (CREDIT_CARD_INSTALLMENT) — amber
- ชื่อ + cardName subtitle (ใช้ map `cards` + `plans` หา card ของ row)
- ยอดเงิน:
  - **CREDIT_CARD** = inline-editable (กดที่ตัวเลข → Input number → Enter/blur commit)
  - **CREDIT_CARD_INSTALLMENT** = read-only (ห้ามแก้จาก tab นี้)
- ปุ่มลบ (🗑):
  - CREDIT_CARD → ลบได้
  - **CREDIT_CARD_INSTALLMENT → disabled** (ลบงวดเดียว = แผนพัง → ต้องจัดการที่ tab 2)
- paid → `opacity-60` + `line-through` ที่ชื่อ + ตัวเลข

## State & client logic

### Month cache
```ts
monthCacheRef: useRef<Map<string, LedgerEntry[]>>
// key = `${year}-${month}` (จาก lib/month.ymKey)
// seed ด้วย initialEntries ของเดือน initialYm
```

### Month navigation flow
1. คำนวณ `next` จาก `shiftMonth(ym, delta)` (lib/month)
2. update URL: `window.history.replaceState(null, "", \`?y=${next.year}&m=${next.month}\`)`
3. ถ้ามี cache → set state ทันที (ไม่ fetch)
4. ถ้าไม่มี cache → `setEntries([])` + ยิง `fetchCreditCardLedgerByMonth` ใน `useTransition`
5. ใช้ `ymRef.current` เช็คก่อน setEntries — กัน race condition (user เปลี่ยนเดือนเร็วๆ)

### Sync จาก server (router.refresh)
```ts
useEffect(() => {
  monthCacheRef.current.set(ymKey(initialYm.year, initialYm.month), initialEntries);
  if (initialYm.year === ym.year && initialYm.month === ym.month) {
    setEntries(initialEntries);
  }
}, [initialEntries, initialYm.year, initialYm.month])
// ตั้งใจไม่ใส่ ym ใน deps
```

## Mutations (optimistic + rollback)

### `handleSubmitCharge(draft)` → `createCreditCardCharge`
- ChargeDialog เปิดมาแล้ว `cards` = `cards.filter(c => c.active)`
- ChargeDialog ส่งกลับ `ChargeDraft` ที่มี `year/month = ym.year/ym.month` เสมอ (เพิ่มได้เฉพาะเดือนที่ดูอยู่)
- success → append เข้า cache ของ `(d.year, d.month)` + setEntries ถ้ายังอยู่เดือนเดียวกัน
- fail → toast "เพิ่มรายการไม่สำเร็จ" (ไม่ rollback อะไรเพราะ optimistic นี้ทำหลัง await)

### `handleTogglePaid(entry)`
- optimistic flip paid + paidAt
- routing ตาม type:
  - CREDIT_CARD → `toggleCreditCardChargePaid`
  - CREDIT_CARD_INSTALLMENT → `toggleInstallmentLedgerPaid`
- fail → rollback + toast "บันทึกไม่สำเร็จ"

### `handleUpdateAmount(entry, amount)` — เฉพาะ `CREDIT_CARD`
- early return ถ้าไม่ใช่ CREDIT_CARD
- optimistic set amount → `updateCreditCardChargeAmount(id, amount)`
- fail → rollback (restore prev entry) + toast

### `handleDelete(entry)` — เฉพาะ `CREDIT_CARD`
- early return ถ้าไม่ใช่ CREDIT_CARD
- optimistic filter out → `deleteCreditCardCharge(id)`
- fail → re-add prev entry + toast "ลบไม่สำเร็จ"

## Queries ที่ใช้

| ใช้เมื่อ | Function | ไฟล์ |
|---|---|---|
| โหลดเดือนแรก (SSR) | `listCreditCardLedgerByMonth(y, m)` | `server/queries/credit-card-charges.ts` |
| เปลี่ยนเดือน (client) | `fetchCreditCardLedgerByMonth(y, m)` (server action) | `server/actions/credit-card-charges.ts` |

ทั้งคู่ query `ledger_entries WHERE userId + year + month + type IN ('CREDIT_CARD','CREDIT_CARD_INSTALLMENT')` ORDER BY `createdAt` ASC

## ChargeDialog (`charge-dialog.tsx`)

ฟิลด์:
| ฟิลด์ | type | required | หมายเหตุ |
|---|---|---|---|
| บัตร | Select | ✓ | จาก `cards.filter(active)` |
| รายการ | text | ✓ | autoFocus |
| หมวดหมู่ | Select | ✓ | `MOCK_CATEGORIES` |
| ยอดเงิน | number | ✓ | `>= 0`, ทศนิยม 2 ตำแหน่ง |

> **ไม่มี input year/month** — ใช้ `ym` ที่ดูอยู่เสมอ
> **ไม่มี toggle "ผ่อน/รูดเต็ม"** — Dialog นี้สร้างเฉพาะรูดเต็ม (ผ่อน = ไปสร้างที่ tab 2)

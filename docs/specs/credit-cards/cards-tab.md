# Cards Tab — บัตรของฉัน

> ดู overview ก่อน: [`credit-cards.md`](./credit-cards.md)

`tab value = "mine"` · file: `src/features/credit-cards/tabs/cards-tab.tsx` + `card-list-view.tsx` + `card-dialog.tsx`

## วัตถุประสงค์

CRUD บัตรเครดิตของ user — บัตรในตารางนี้คือ source ของ dropdown ใน statement-tab (ChargeDialog) และ installment-tab (PlanDialog)

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ active 3 · inactive 1                          [ + เพิ่มบัตร ] │
├─ ACTIVE (3) ───────────────────────────────────────────────────┤
│ ┌─ ⚪→🟢 UOB Premier  [****1234]                          [⋯] ─┐│
│ │   UOB    ตัดรอบ 10    ครบกำหนด 28                          ││
│ └─────────────────────────────────────────────────────────────┘│
│ ...                                                              │
├─ INACTIVE (1) ─────────────────────────────────────────────────┤
│ ┌─ 🔴→⚪ KKP First Choice                                  [⋯] ─┐│
│ │   KKP    ตัดรอบ 5     ครบกำหนด 25                          ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Header
- subtitle: `active N · inactive N` (count แบบสด)
- ปุ่ม `[ + เพิ่มบัตร ]` (right) → เปิด `<CardDialog>` mode สร้าง

### Empty state
ถ้า `cards.length === 0` → "ยังไม่มีบัตร — กด 'เพิ่มบัตร'"

### Sections (เฉพาะที่มี)
- `Active (n)` — `cards.filter(c => c.active)`
- `Inactive (n)` — `cards.filter(c => !c.active)`

แต่ละ section header style: `text-xs font-semibold uppercase tracking-wide text-muted-foreground`

### CardRow ต่อใบ
- **Switch** (active toggle)
  - `data-checked:bg-emerald-500` (เขียว = active)
  - `data-unchecked:bg-rose-500` (แดง = inactive)
- ชื่อบัตร + `<Badge variant="outline">****XXXX</Badge>` (ถ้ามี 4-digit)
- subtitle: bank name (จาก `MOCK_BANKS` lookup) · `ตัดรอบ X` · `ครบกำหนด Y` (เฉพาะที่มีค่า)
- `!card.active` → `opacity-50` ทั้ง card
- Dropdown menu (⋯):
  - "แก้ไข" → เปิด `<CardDialog>` mode edit
  - "ลบ" (สีแดง) → เปิด `<AlertDialog>` confirm

## CardDialog (`card-dialog.tsx`)

ฟิลด์:
| ฟิลด์ | type | required | validation |
|---|---|---|---|
| ธนาคาร | Select | ✓ | จาก `MOCK_BANKS` (UOB / TTB / SCB / KBank / KKP / KTC) |
| ชื่อบัตร | text | ✓ | autoFocus, `trim().length > 0` |
| 4 ตัวท้าย | text | — | optional, ถ้าใส่ต้อง `/^\d{4}$/` (`maxLength=4` + strip non-digit ขณะพิมพ์) |
| วันตัดรอบบิล | number 1-31 | — | optional, validate integer 1-31 |
| วันครบกำหนดชำระ | number 1-31 | — | optional, validate integer 1-31 |

> **Spec เก่าผิด**: เคยระบุ `วันตัดรอบ / วันครบกำหนด = required` — code จริงเป็น **optional ทั้งคู่** (`nullable` ใน server action + dialog accept empty string → `null`)

Submit → `CardDraft`:
```ts
{
  name: string;
  bankId: string;
  lastFourDigits: string | null;
  statementDate: number | null;
  dueDate: number | null;
}
```

หัวข้อ dialog เปลี่ยนตาม mode:
- create → "เพิ่มบัตรเครดิต"
- edit (`initial` ไม่ null) → "แก้ไขบัตรเครดิต"

## Mutations (optimistic + rollback)

| Handler | Server action | optimistic | rollback |
|---|---|---|---|
| `handleSubmit` (create) | `createCreditCard` | (post-await) append row | ไม่มี optimistic — toast.error เท่านั้น |
| `handleSubmit` (edit) | `updateCreditCard(id, d)` | map update field ทันที | restore prev card |
| `handleToggleActive` | `toggleCreditCardActive(id, next)` | flip active | flip กลับ |
| `confirmDelete` | `deleteCreditCard(id)` | filter ออก | `setCards(p => [...p, prev])` (push กลับ) — note: เรียง order อาจเพี้ยน (push ท้าย) |

## Toggle active behavior

- active = `false` →
  - ซ่อนจาก ChargeDialog/PlanDialog dropdown (`cards.filter(c => c.active)`)
  - ledger entries + plans ที่ผูกกับบัตรนี้ **คงอยู่** (ไม่ลบ ไม่ซ่อน)
  - statement-tab grid ใช้ `activeCards` แสดง — บัตร inactive ไม่โผล่เป็นการ์ดสรุปแต่งวดผ่อน/รายการเก่ายังอยู่ในตาราง

## Delete behavior

- เปิด `<AlertDialog>`: "ลบ '{name}' — ถ้ามีแผนผ่อนผูกอยู่จะลบไม่ได้"
- กด confirm → optimistic remove + ยิง `deleteCreditCard(id)`
- **FK constraint `credit_card_installments.creditCardId` = `onDelete: 'restrict'`** → ถ้ายังมีแผนผ่อนผูก: SQL error → catch ใน try/catch → `toast.error("ลบบัตรไม่สำเร็จ — อาจมีแผนผ่อนผูกอยู่")` + restore card
- ถ้าไม่มี plan ผูก → ลบสำเร็จ (ledger CREDIT_CARD rows ถูก cascade ลบไปด้วย เพราะ `users` FK cascade — แต่จริงๆ ledger ไม่มี FK ตรงไปยัง credit_cards · sourceId เป็น text · → **ledger CREDIT_CARD rows จะ orphan**)

> ⚠️ ลบบัตรแล้ว ledger `type=CREDIT_CARD` ที่ `sourceId=card.id` จะ **orphan** (cardOfEntry คืน undefined → ไม่ render ใน statement-tab) — ไม่ใช่บัก แต่ rows ยังอยู่ใน DB

## Open questions

- **วงเงิน (credit limit)** — schema ไม่มีฟิลด์ ถ้าจะแสดง "วงเงินคงเหลือ" ใน statement-tab ต้อง:
  1. เพิ่ม column `creditLimit numeric` ใน `credit_cards`
  2. เพิ่ม input ใน CardDialog
  3. คำนวณใน StatementView (limit − sum ของ ledger ที่ยังไม่ paid)
- **bankId mock** — ตอนนี้เป็น text + lookup `MOCK_BANKS` หลังต่อ admin banks table จะเปลี่ยนเป็น uuid + FK
- **ลบบัตร = orphan CREDIT_CARD ledger rows** — ถ้าต้องการ cascade ต้องตั้ง FK `ledger_entries.sourceId → credit_cards.id` (ทำไม่ได้ตรงๆ เพราะ sourceId เป็น text shared ระหว่าง type) → อาจต้องเปลี่ยนเป็น cleanup ใน server action แทน

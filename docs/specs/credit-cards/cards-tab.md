# Cards Tab — บัตรของฉัน

> ดู overview ก่อน: [`credit-cards.md`](./credit-cards.md)

`tab value = "mine"` · files:
- `src/features/credit-cards/tabs/cards-tab.tsx` — orchestrator (state + mutations)
- `src/features/credit-cards/card-face-grid.tsx` — grid + `CardFace`
- `src/features/credit-cards/card-dialog.tsx` — create/edit form
- `src/lib/banks.ts` — bank brand (label/bg/fg) + `CARD_NETWORKS`

## วัตถุประสงค์

CRUD บัตรเครดิตของ user — บัตรในตารางนี้คือ source ของ dropdown ใน statement-tab (ChargeDialog) และ installment-tab (PlanDialog)

## Layout

หน้านี้เป็น **grid ของหน้าบัตรเต็มใบ (CardFace)** ไม่ใช่ list แบบแถวเดิม

```
┌─────────────────────────────────────────────────────────────────┐
│ ใช้งาน 3 · ปิดใช้งาน 1                          [ + เพิ่มบัตร ] │
├─ ใช้งานอยู่ (3) ────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ ▢       ⬤ ⋯    │ │ ▢       ⬤ ⋯    │ │ ▢       ⬤ ⋯    │ │
│ │                  │ │                  │ │                  │ │
│ │ UOB Premier      │ │ KBank One        │ │ SCB Beyond       │ │
│ │ •••• •••• •• 1234│ │ •••• •••• •• 5678│ │ •••• ••••        │ │
│ │ UOB · ตัดรอบ 10  │ │ KBank · ตัดรอบ 5 │ │ SCB        VISA  │ │
│ │            VISA  │ │      Mastercard  │ │                  │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
├─ ปิดใช้งาน (1) ────────────────────────────────────────────────┤
│ ┌──────────────────┐  (หม่นลงด้วย opacity)                     │
│ │ ▢       ◯ ⋯    │                                            │
│ │ KKP First Choice │                                            │
│ │ •••• •••• •• 9012│                                            │
│ │ KKP · ตัดรอบ 5   │                                            │
│ └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Grid
- `grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3` — responsive ทุก breakpoint
- section spacing: header → grid `gap-2.5` · section ↔ section `gap-5`

### Header
- chip ซ้าย: `ใช้งาน N · ปิดใช้งาน N` (count แบบสด) — `text-sm text-muted-foreground`
- ปุ่ม `[ + เพิ่มบัตร ]` ขวา → เปิด `<CardDialog>` mode สร้าง

### Empty state
ถ้า `cards.length === 0` → กรอบ dashed `rounded-xl border border-dashed bg-muted/30` ข้อความ "ยังไม่มีบัตร — กด 'เพิ่มบัตร'"

### Sections (เฉพาะที่มี)
- `ใช้งานอยู่ (n)` — `cards.filter(c => c.active)`
- `ปิดใช้งาน (n)` — `cards.filter(c => !c.active)`

section header style: `text-xs font-medium text-muted-foreground` (sentence case ภาษาไทย — **ไม่ใช้ ALL CAPS**)

### CardFace ต่อใบ
- กรอบ: `rounded-xl p-4 min-h-[150px] flex flex-col justify-between shadow-sm`
- พื้นสี = `getBankBrand(card.bankId).bg` (**flat ไม่มี gradient**)
- ตัวอักษรสี = `.fg`
- **แถวบน:**
  - ซ้าย: chip สี่เหลี่ยม ~`h-[22px] w-[30px]` มน โปร่งแสง `bg-white/15` (เลียนแบบชิปบัตรจริง)
  - ขวา: `<Switch>` (toggle active) + `<DropdownMenu>` ปุ่ม `⋯` (icon ghost, hover `bg-white/15`)
- **ส่วนล่าง:**
  - ชื่อบัตร `name` (`text-base font-semibold truncate`)
  - เลขบัตร: `•••• •••• •••• {last_four_digits}` (`font-mono text-sm tracking-[0.18em]`)
  - แถวล่างสุด:
    - ซ้าย: `{BANK_LABEL}{statementDate ? ' · ตัดรอบ N' : ''}` (`text-xs opacity-85`)
    - ขวา: ป้าย network (Badge ขอบโปร่ง `text-[10px] uppercase tracking-wider`)
- **เงื่อนไขซ่อน:**
  - `cardNetwork = null` → ไม่โชว์ป้าย network
  - `statementDate = null` → ไม่โชว์ "ตัดรอบ N" (เหลือแค่ bank label)
  - `lastFourDigits = null` → โชว์ `•••• ••••` (8 จุด ไม่ใช่ 12+4)
- บัตร **inactive** → `opacity-55` ทั้งใบ + `transition-opacity`

### Switch สีบนพื้นบัตร
- `data-checked:bg-emerald-500` (เขียว = active)
- `data-unchecked:bg-white/25` (โปร่งแสงให้กลืนกับพื้นบัตร — ไม่ใช่ rose-500 แบบหน้า list เดิม)

### Dropdown menu (⋯)
- "แก้ไข" → เปิด `<CardDialog>` mode edit
- "ลบ" (text-destructive) → เปิด `<AlertDialog>` confirm

## CardDialog (`card-dialog.tsx`)

ฟิลด์:
| ฟิลด์ | type | required | validation |
|---|---|---|---|
| ธนาคาร | Select | ✓ | จาก `MOCK_BANKS` (UOB / TTB / SCB / KBank / KKP / KTC) |
| ชื่อบัตร | text | ✓ | autoFocus, `trim().length > 0` |
| 4 ตัวท้าย | text | — | optional, ถ้าใส่ต้อง `/^\d{4}$/` (`maxLength=4` + strip non-digit ขณะพิมพ์) |
| เครือข่าย | Select | — | optional, ค่าจาก `CARD_NETWORKS` (`visa`/`mastercard`/`jcb`/`amex`/`unionpay`) + ตัวเลือก "ไม่ระบุ" → `null` |
| วันตัดรอบบิล | number 1-31 | — | optional, validate integer 1-31 |
| วันครบกำหนดชำระ | number 1-31 | — | optional, validate integer 1-31 |

> Layout: 4 ตัวท้าย + เครือข่าย จัด `grid-cols-2 gap-3` แถวเดียวกัน · วันตัดรอบ + วันครบกำหนด อีก `grid-cols-2`

Submit → `CardDraft`:
```ts
{
  name: string;
  bankId: string;
  lastFourDigits: string | null;
  cardNetwork: CardNetwork | null;
  statementDate: number | null;
  dueDate: number | null;
}
```

หัวข้อ dialog เปลี่ยนตาม mode:
- create → "เพิ่มบัตรเครดิต"
- edit (`initial` ไม่ null) → "แก้ไขบัตรเครดิต"

Dialog เป็น adaptive sheet/dialog — มือถือเปิดเป็น `<Sheet side="bottom">` · desktop เปิดเป็น `<Dialog>` (ผ่าน `useIsMobile`)

## Mutations (optimistic + rollback)

| Handler | Server action | optimistic | rollback |
|---|---|---|---|
| `handleSubmit` (create) | `createCreditCard` | (post-await) append row | ไม่มี optimistic — toast.error เท่านั้น |
| `handleSubmit` (edit) | `updateCreditCard(id, d)` | map update field ทันที (รวม `cardNetwork`) | restore prev card |
| `handleToggleActive` | `toggleCreditCardActive(id, next)` | flip active | flip กลับ |
| `confirmDelete` | `deleteCreditCard(id)` | filter ออก | `setCards(p => [...p, prev])` (push กลับ) — note: เรียง order อาจเพี้ยน (push ท้าย) |

zod ฝั่ง server (`server/actions/credit-cards.ts`) — `upsertSchema`:
- `cardNetwork: z.enum(CARD_NETWORKS).nullable()` — null ได้ ถ้าไม่ใช่ค่าใน enum จะ throw

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

## Bank brand config

source: `src/lib/banks.ts`

```ts
BANKS: Record<bankId, { id, label, bg, fg }>
FALLBACK_BANK            // ใช้เมื่อ bank_id ไม่อยู่ใน BANKS
getBankBrand(bankId)     // never-throw lookup → fallback ถ้าไม่เจอ
BANK_LIST                // Bank[] ที่ MOCK_BANKS derive ต่อ
CARD_NETWORKS            // const ['visa','mastercard','jcb','amex','unionpay']
getNetworkLabel(value)   // 'visa' → 'VISA' · 'mastercard' → 'Mastercard' · etc.
```

- bg/fg = **brand color hardcode** ตั้งใจ (ข้อยกเว้นของกฎ "ห้าม hardcode สี")
- ใช้ `getBankBrand` แทน `BANKS[id]` เสมอ ป้องกัน card หลุดจากที่ admin table ยังไม่มี

## Open questions

- **วงเงิน (credit limit)** — schema ไม่มีฟิลด์ ถ้าจะแสดง "วงเงินคงเหลือ" ใน statement-tab ต้อง:
  1. เพิ่ม column `creditLimit numeric` ใน `credit_cards`
  2. เพิ่ม input ใน CardDialog
  3. คำนวณใน StatementView (limit − sum ของ ledger ที่ยังไม่ paid)
- **bankId mock** — ตอนนี้เป็น text + lookup `MOCK_BANKS`/`BANKS` หลังต่อ admin banks table จะเปลี่ยนเป็น uuid + FK
- **ลบบัตร = orphan CREDIT_CARD ledger rows** — ถ้าต้องการ cascade ต้องตั้ง FK `ledger_entries.sourceId → credit_cards.id` (ทำไม่ได้ตรงๆ เพราะ sourceId เป็น text shared ระหว่าง type) → อาจต้องเปลี่ยนเป็น cleanup ใน server action แทน
- **`due_date` ยังไม่ใช้บน CardFace** — แสดงแค่ `ตัดรอบ` · ถ้าต้องการโชว์ "ครบกำหนด" ด้วย จะอยู่ใน line เดียวกันหรือบรรทัดใหม่

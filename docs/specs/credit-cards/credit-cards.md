# Credit Cards — overview

route `/credit-cards` · หน้าเดียว 3 tabs · โมดูลที่ซับซ้อนที่สุดของแอป (รวมการรูดเต็ม + ผ่อน 0%/มีดอก + ปิดก่อนกำหนด + รอบบิลรายเดือน)

> **ห้ามเดา logic** — อ่าน spec ของ tab ที่จะแก้ก่อน

## โครงสร้าง

| Tab | ค่า `value` | ชื่อแสดง | spec |
|---|---|---|---|
| 1 | `statement` (default) | รายการชำระบัตรเครดิต | [`statement-tab.md`](./statement-tab.md) |
| 2 | `installment` | รายการผ่อนชำระ | [`installment-tab.md`](./installment-tab.md) |
| 3 | `mine` | บัตรของฉัน | [`cards-tab.md`](./cards-tab.md) |

ทุก tab ใช้ `keepMounted` — state ใน tab (เช่น month cache ของ statement) ไม่รีเซ็ตตอนสลับ

## Data fetch (server)

`src/app/(portal)/credit-cards/page.tsx` parse `?y=` + `?m=` (default = เดือนปัจจุบัน · validate `y` 1970-9999, `m` 1-12) แล้ว `Promise.all` 4 query:

| Query | ใช้ที่ |
|---|---|
| `listCreditCards()` | ทุก tab (cards state ร่วม) |
| `listInstallmentPlans()` | tab 2 + tab 1 (lookup card ของงวดผ่อน) |
| `listCreditCardLedgerByMonth(y, m)` | tab 1 statement |
| `listAllInstallmentEntries()` | tab 2 (client-side filter รายแผน) |

ส่งทั้งหมดเป็น props ลง `<CreditCardsApp>` (orchestrator client component)

## Data model (สรุป)

> source of truth = `src/db/schema/` — ตรงนี้แสดงความสัมพันธ์

```
credit_cards
  ├─ userId, bankId (text mock), name, lastFourDigits?
  ├─ cardNetwork? ('visa' | 'mastercard' | 'jcb' | 'amex' | 'unionpay')
  ├─ statementDate? (1-31), dueDate? (1-31)
  └─ active

credit_card_installments
  ├─ userId, creditCardId → credit_cards (onDelete: restrict)
  ├─ totalAmount, installmentAmount (ต่องวด)
  ├─ installmentPrincipal?, installmentInterest?  NULL = ยังไม่รู้ split (mode 3)
  ├─ totalInstallments, startYear, startMonth
  ├─ hasInterest
  ├─ status: 'active' | 'early_settled'  (completed / near-end = derive ฝั่ง UI)
  └─ settlementAmount?, closedAt?  ใช้ตอน early-settle

ledger_entries
  ├─ type='CREDIT_CARD'              + sourceType='credit_card'              + sourceId=card.id  → รูดเต็ม
  └─ type='CREDIT_CARD_INSTALLMENT'  + sourceType='credit_card_installment'  + sourceId=plan.id  → 1 งวด
```

**ไม่มีตาราง `statements`** — statement รายเดือน = "ledger entries ที่ผูกกับบัตรนั้น + year/month เดียวกัน" (derive ตอน query/render)

**ทุกงวดถูก materialize ตอน create plan** — insert ledger rows N rows (= `totalInstallments`) ภายใน transaction เดียวกันกับ insert plan ไม่มี cron generate ภายหลัง

## State management (`CreditCardsApp`)

```
src/features/credit-cards/credit-cards-app.tsx
```

state ร่วมระดับ orchestrator:
- `cards` (sync จาก `initialCards` ผ่าน `useEffect`)
- `plans` (sync จาก `initialPlans`)
- `installmentEntries` (sync จาก `initialInstallmentEntries`)

state ภายใน tab:
- StatementTab: `ym`, `entries`, `monthCacheRef` (Map keyed `"year-month"`)
- InstallmentTab: dialog state เท่านั้น (plans/entries ใช้จาก parent)
- CardsTab: dialog/editing state เท่านั้น

`useEffect` sync จาก props ใหม่ → เกิดขึ้นเมื่อ `router.refresh()` หรือ `revalidatePath` ทำงาน (เช่นหลัง settle/delete plan)

## Logic ที่ cross ระหว่าง tab

1. **งวดผ่อนโผล่ใน statement อัตโนมัติ (tab 2 → tab 1)**
   ledger rows ทุกงวดถูก insert ตั้งแต่ create plan → tab 1 query รวม `type IN ('CREDIT_CARD', 'CREDIT_CARD_INSTALLMENT')` แล้ว lookup บัตรผ่าน:
   - row type=CREDIT_CARD → `sourceId` = `card.id` ตรงๆ
   - row type=CREDIT_CARD_INSTALLMENT → `sourceId` = `plan.id` → `plan.creditCardId` = card

2. **เพิ่มจาก tab 1 (`เพิ่มรายการรูด`) ≠ เพิ่มจาก tab 2 (`เพิ่มแผนผ่อน`)**
   - tab 1 charge dialog → insert 1 row `type=CREDIT_CARD` (ไม่ผ่อน)
   - tab 2 plan dialog → insert 1 plan + N ledger rows `type=CREDIT_CARD_INSTALLMENT`

3. **ปิดก่อนกำหนด (tab 2)**
   - update plan: `status='early_settled'` + `settlementAmount` + `closedAt`
   - **ลบ ledger rows ที่ยังไม่ paid** ของ plan นั้น (ไม่โผล่ใน tab 1 อีก)
   - **insert ledger row "ปิดก่อนกำหนด"** 1 row (`paid=true`, `note='ปิดก่อนกำหนด'`, year/month = user เลือก)
   - paid rows เดิม → คงไว้ใน ledger

4. **บัตร inactive (tab 3)**
   - ซ่อนจาก dropdown ของ ChargeDialog / PlanDialog
   - **ไม่ลบ** statement / installment ที่ผูกกับบัตรไปแล้ว
   - ลบบัตรไม่ได้ถ้ายังมี installment plan ผูกอยู่ (FK `onDelete: 'restrict'`)

## Server actions (ทุกตัว `revalidatePath('/credit-cards')`)

`src/server/actions/credit-cards.ts`
- `createCreditCard` · `updateCreditCard` · `toggleCreditCardActive` · `deleteCreditCard`

`src/server/actions/credit-card-charges.ts`
- `fetchCreditCardLedgerByMonth(y, m)` — **ไม่ revalidate** (client เก็บ cache เอง ตอนเปลี่ยนเดือน)
- `createCreditCardCharge` · `toggleCreditCardChargePaid` · `updateCreditCardChargeAmount` · `deleteCreditCardCharge`
- ทุกตัวคุม `type='CREDIT_CARD'` (toggle/update/delete ของรายการรูดเต็มเท่านั้น)

`src/server/actions/credit-card-installments.ts`
- `createInstallmentPlan` — **transaction** (insert plan + N ledger rows)
- `toggleInstallmentLedgerPaid` — toggle 1 งวด (`type='CREDIT_CARD_INSTALLMENT'`)
- `updateLedgerInterestSplit` — set principal + interest + amount = (p+i) (สำหรับ mode 3)
- `settleInstallmentEarly` — **transaction** (delete unpaid + insert settlement row + flip plan)
- `deleteInstallmentPlan` — **transaction** (delete unpaid ledger + delete plan; paid rows orphan)

## UI rules (ทั้ง 3 tabs)

- shadcn-only · เงินผ่าน `formatMoney` · เดือนผ่าน `formatYearMonth` (`YYYY/MM`)
- Tab trigger style = underline pure (active = `font-semibold text-primary` + `border-b-2`)
- ทุก mutation = **optimistic UI** + rollback ใน catch · `toast.error` ทุกครั้งที่ fail
- mock dropdowns ใช้ `src/features/credit-cards/mock.ts`:
  - `MOCK_BANKS` (6 ธนาคาร — UOB, TTB, SCB, KBank, KKP, KTC) — derive จาก `BANK_LIST` ใน `lib/banks.ts`
  - `MOCK_CATEGORIES` (7 หมวด — อาหาร, น้ำมัน, ช้อปปิ้ง, อิเล็กทรอนิกส์, เฟอร์นิเจอร์, ท่องเที่ยว, อื่นๆ)
- bank brand (label/bg/fg) อยู่ใน `src/lib/banks.ts` — single source ของ bank color ที่ใช้บนหน้า CardFace
  - **ข้อยกเว้นที่ตั้งใจ** ของกฎ "ห้าม hardcode สี" — สีอื่นใน UI ยังต้องผ่าน token shadcn/Tailwind
- card network constants + label อยู่ใน `lib/banks.ts` (`CARD_NETWORKS`, `getNetworkLabel`)

# Spec: บัตรเครดิต — overview

route `/credit-cards` · 3 tabs ในหน้าเดียว

โมดูลที่ซับซ้อนที่สุด: รวมการรูดเต็มจำนวน, การผ่อน (0% / มีดอก), การปิดยอดก่อนกำหนด, และรอบบิลรายเดือนต่อใบ — **ห้ามเดา logic** ให้อ่าน spec ของ tab ที่ตรงกับสิ่งที่จะแก้

## โครงสร้าง

| Tab | ชื่อ | spec |
|---|---|---|
| 1 | รายการชำระบัตรเครดิต (statement รายเดือน) | [`tab1-statement.md`](./tab1-statement.md) |
| 2 | รายการผ่อนชำระ (cross-month installment plans) | [`tab2-installment.md`](./tab2-installment.md) |
| 3 | บัตรของฉัน (CRUD บัตร) | [`tab3-cards.md`](./tab3-cards.md) |

## Data model (ภาพรวม)

> ดูตารางจริงที่ `src/db/schema/` — ตรงนี้สรุปสั้นเพื่อให้เห็นความสัมพันธ์

ไม่มีตาราง `statements` แยก — statement รายเดือนคือ "ledger entries ที่ผูกกับบัตรนั้น + year/month" (derive ฝั่ง query)

```
credit_cards (1 บัตร = 1 row)
  ├─ bankId, name, lastFourDigits
  ├─ statementDate, dueDate (1-31)
  └─ active

credit_card_installments (1 แผนผ่อน = 1 row)
  ├─ creditCardId          → credit_cards.id
  ├─ totalAmount           ยอดเต็ม
  ├─ installmentAmount     ค่างวด/เดือน
  ├─ installmentPrincipal/installmentInterest  รู้ split ก็เซ็ต / ไม่รู้ = NULL
  ├─ totalInstallments     จำนวนงวด
  ├─ startYear/startMonth  งวดแรกตกเดือนไหน
  ├─ hasInterest           true = มีดอก
  ├─ status                'active' | 'early_settled'  (completed/near-end = derive ฝั่ง UI)
  └─ settlementAmount, closedAt  ใช้ตอน early-settle

ledger_entries (รายการจริงรายเดือน — type ระบุประเภท)
  ├─ type='CREDIT_CARD'              + sourceType='credit_card'              + sourceId=card.id        → รูดเต็ม
  └─ type='CREDIT_CARD_INSTALLMENT'  + sourceType='credit_card_installment'  + sourceId=installment.id → 1 งวด
```

ตอน create installment plan → insert `credit_card_installments` 1 row + insert `ledger_entries` N rows (เท่ากับ `totalInstallments`) ทันที — ทุกงวดถูก materialize เลย ไม่ต้อง generate ภายหลัง

## Logic ที่ cross ระหว่าง tab

1. **งวดผ่อนโผล่ใน statement อัตโนมัติ (tab 2 → tab 1)**
   งวด ledger ของแผนผ่อนถูก insert ตอน create plan แล้ว — query tab 1 ดึงทุก `ledger_entries` ที่ `sourceId=card.id` หรือ join ผ่าน installments ที่ `creditCardId=card.id` ในเดือนนั้น
2. **เพิ่มการรูด (tab 1) → ไม่ผ่อน vs ผ่อน**
   - "รูดเต็มจำนวน" → insert `ledger_entries` type=CREDIT_CARD ตรง ๆ
   - "ผ่อน" → insert `credit_card_installments` + ledger rows N งวด (เริ่มจาก `startYear`/`startMonth`)
3. **ปิดก่อนกำหนด (tab 2)**
   - update installment: `status='early_settled'` + `settlementAmount` + `closedAt`
   - งวดที่ยังไม่ paid → ลบ ledger rows ทิ้ง (ไม่โผล่ใน tab 1 อีก)
4. **บัตร inactive (tab 3)**
   - ไม่ลบบัตร / installment / ledger ที่เคยมี — แค่ซ่อนจาก dropdown ตอนเพิ่มรายการ

## UI

- Tabs แบบ underline pure (active = `font-semibold text-primary` + `border-b-2`)
- Month navigator ใช้เฉพาะ tab 1 (statement) — tab 2/3 ไม่ผูกกับเดือน
- เงินผ่าน `formatMoney` · เดือนผ่าน `formatYearMonth` (`YYYY/MM`)

## Server Actions

`src/server/actions/credit-card-*.ts` — ทุก mutation `revalidatePath('/credit-cards')`

- `credit-cards.ts` — CRUD บัตร
- `credit-card-charges.ts` — เพิ่ม/ลบ/mark paid ค่ารูดเต็มจำนวน
- `credit-card-installments.ts` — สร้างแผนผ่อน, ปิดก่อนกำหนด, mark งวด paid

## สถานะปัจจุบัน

ทุก tab ทำงาน end-to-end แล้ว (commit history ใน `git log -- src/features/credit-cards/`) — spec นี้สะท้อน design ตอนตัดสินใจ ถ้า UI/logic ใน code ต่างจาก spec ให้ถือว่า code เป็นความจริงและถามเจ้าของก่อนแก้

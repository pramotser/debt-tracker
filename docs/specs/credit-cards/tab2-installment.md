# Tab 2 — รายการผ่อนชำระ (cross-month installment plans)

> ดู overview ที่ [`README.md`](./README.md) ก่อน

## วัตถุประสงค์

ดูภาพรวมแผนผ่อนทุกแผนของ user — ไม่ผูกกับ month navigator (ผ่อนข้ามเดือน) เพื่อมอนิเตอร์ภาระหนี้คงเหลือทั้งหมด

## Layout

### Helper alert
```
💡 แท็บนี้แสดงแผนผ่อนระยะยาวทุกแผน ไม่ขึ้นกับเดือนที่เลือก เพื่อมอนิเตอร์ภาระหนี้รวม
```

### Summary cards (4 ใบ แนวนอน)
- เดือนนี้ต้องจ่าย — sum งวดที่ year+month = currentMonth ของแผน active
- ยอดคงเหลือรวม — sum งวด unpaid ของแผน active
- กำลังผ่อน — count แผน status='active'
- ใกล้จบ — count แผน active ที่เหลือ ≤ 1 งวด unpaid

### Installment cards (1 ใบ = 1 แผน)
แบ่งเป็น section ตามสถานะ (derived):
1. **กำลังผ่อน** — status='active' และยังไม่ใกล้จบ
2. **ใกล้จบ** — status='active' + เหลือ ≤ 1 งวด
3. **ผ่อนครบแล้ว** — status='active' + ทุกงวด paid
4. **ปิดก่อนกำหนด** — status='early_settled'

ต่อการ์ด:
- ชื่อสินค้า + บัตร + หมวด
- ยอดเต็ม / ยอดคงเหลือ / ค่างวด/เดือน
- Progress bar `paidCount / totalInstallments` + label `เหลือ X งวด (฿Y)`
- คาดว่าจะจบ : เดือน/ปี (คำนวณจาก `startYear/startMonth + totalInstallments - 1`)
- ปุ่ม "ดูรายงวด" → expand list งวดทั้งหมด (period table)
- ปุ่ม "ปิดก่อนกำหนด" (เฉพาะ active) → dialog กรอกยอดปิด → submit

### Period drilldown (ในการ์ดที่ expand)
ตารางงวด 1..N — งวด, เดือนจ่าย, ค่างวด, principal, interest, paid checkbox

## Logic

- Query: `credit_card_installments WHERE userId` + JOIN `ledger_entries` ผ่าน `sourceId=installment.id` เพื่อนับ paid/unpaid
- "ใกล้จบ" / "ผ่อนครบ" คำนวณฝั่ง UI จาก `paidCount` (ไม่มี enum status แยก)
- ปิดก่อนกำหนด:
  ```
  update credit_card_installments
    set status='early_settled', settlementAmount=X, closedAt=now()
  delete ledger_entries
    where sourceType='credit_card_installment'
      and sourceId=installmentId
      and paid=false
  ```
- งวดผ่อนเข้าเดือนใหม่อัตโนมัติ — เพราะ ledger rows ทุกงวด insert ไว้ตอน create plan แล้ว (ดู overview) ไม่ต้องมี cron

## UI rules

- การ์ดสถานะแยกสีอ่อน ๆ (กำลังผ่อน = neutral · ใกล้จบ = amber · ครบ = green · ปิดก่อน = blue)
- Progress bar สีน้ำเงิน-อินดิโก้
- ห้ามแสดง interest แยก ถ้า `installmentPrincipal/installmentInterest` = NULL (ผ่อน 0% หรือไม่รู้ split)

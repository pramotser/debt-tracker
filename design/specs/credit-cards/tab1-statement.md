# Tab 1 — รายการชำระบัตรเครดิต (statement รายเดือน)

> ดู overview ที่ [`README.md`](./README.md) ก่อน

## วัตถุประสงค์

ดูยอดที่ต้องเตรียมจ่ายในเดือนนั้นต่อบัตร — รวมทั้งการรูดเต็มจำนวน + งวดผ่อนที่ตกในเดือนนั้น เป็นหน้าที่ใช้บ่อยที่สุด

## Layout

### Month navigator
```
◀  มิถุนายน 2026  ▶
```
- เปลี่ยนเดือนได้อิสระทั้งอดีต/อนาคต (ไม่มี disabled)
- default = เดือนปัจจุบัน

### Credit card grid (horizontal)
1 การ์ดต่อบัตร active — สรุปยอดของเดือนที่เลือก
- ชื่อบัตร + bank
- ยอดบิลเดือนนี้ (sum ของ ledger entries ที่ผูกกับบัตรในเดือนนั้น)
- วันครบกำหนดจ่าย (จาก `creditCards.dueDate`)
- (วงเงินคงเหลือยังไม่ทำ — schema ไม่มีฟิลด์วงเงิน)

### Transaction table
- ปุ่ม `[ + เพิ่มรายการรูด ]` ที่หัวตาราง → modal เลือก บัตร / หมวด / ชื่อ / จำนวน / "รูดเต็ม" หรือ "ผ่อน"
- column: ประเภท / รายการ / บัตร / กำหนดจ่าย / ยอด / action

| ประเภท | รายการ | บัตร | กำหนดจ่าย | ยอด | action |
|---|---|---|---|---|---|
| รูดเต็ม | ค่าน้ำมัน | UOB Premier | 28 มิ.ย. 2026 | ฿610.00 | mark paid / ลบ |
| ผ่อน | iPad Pro (5/10) | UOB Premier | 28 มิ.ย. 2026 | ฿3,386.00 | mark paid / ลบ |

## Logic

- Query: `ledger_entries WHERE userId + year + month + type IN ('CREDIT_CARD','CREDIT_CARD_INSTALLMENT')` join บัตรผ่าน `sourceId` (สำหรับ CREDIT_CARD) หรือผ่าน `credit_card_installments.creditCardId` (สำหรับ CREDIT_CARD_INSTALLMENT)
- Mark as paid → toggle `paid` + `paidAt` ของ ledger row นั้น (ถ้าเป็นงวดผ่อน = toggle เฉพาะงวด ไม่ปิดทั้งแผน)
- ลบรายการ
  - ลบรูดเต็ม → ลบ ledger row ตรง ๆ
  - ลบงวดผ่อน → ห้ามลบเฉพาะงวด (broken plan) — ต้องไปจัดการที่ tab 2 แทน (UI ซ่อนปุ่มลบสำหรับ row งวดผ่อน)
- เปลี่ยนเดือน → query ใหม่ทั้งหมด (ยอดบิลแต่ละการ์ดเปลี่ยนตาม)

## UI rules

- ตามกฎรวม: shadcn-only, เงินผ่าน `formatMoney`, เดือนผ่าน `formatYearMonth`
- งวดผ่อนแสดง `(งวด x/N)` ต่อท้ายชื่อ
- paid แล้ว → ขีดฆ่า + opacity-60

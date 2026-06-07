# Tab 3 — บัตรของฉัน (CRUD บัตรเครดิต)

> ดู overview ที่ [`README.md`](./README.md) ก่อน

## วัตถุประสงค์

จัดการบัตรเครดิตของ user — บัตรในตารางนี้คือ dropdown ที่จะโผล่ใน tab 1 (เพิ่มรายการรูด/ผ่อน)

## Layout

### List
1 row ต่อบัตร: ชื่อ + bank + เลข 4 ตัวสุดท้าย + วันตัดรอบ + วันครบกำหนด + toggle active + ปุ่มแก้/ลบ

### ปุ่ม `[ + เพิ่มบัตร ]`
เปิด dialog ฟอร์ม

### ฟอร์ม (เพิ่ม / แก้)
| ฟิลด์ | type | required | หมายเหตุ |
|---|---|---|---|
| ธนาคาร | Select | ✓ | ตอนนี้เป็น list mock — ต่อ admin table ทีหลัง |
| ชื่อบัตร | text | ✓ | เช่น "UOB Premier", "TTB So Smart" |
| เลข 4 ตัวสุดท้าย | text | — | optional, บางคนไม่อยากเก็บ |
| วันตัดรอบบิล | number 1-31 | ✓ | |
| วันครบกำหนดชำระ | number 1-31 | ✓ | |

ปุ่ม `[ บันทึก ]` แบบ full-width

## Logic

- Submit → `createCreditCard()` / `updateCreditCard()` ใน `server/actions/credit-cards.ts` → `revalidatePath('/credit-cards')` → tab 1 dropdown อัปเดตทันที (ไม่ต้องรีเฟรช)
- toggle `active`:
  - active=false → ซ่อนจาก dropdown ตอนเพิ่มรายการรูด/ผ่อน
  - **ไม่ลบ** statement / installment ที่ผูกกับบัตรไปแล้ว
- ลบบัตร → restrict ถ้ายังมี `credit_card_installments` ผูกอยู่ (FK `onDelete: 'restrict'` ใน schema) → แสดง error ให้ปิดแผนผ่อนทั้งหมดก่อน

## Open questions

- **วงเงิน (credit limit)** — schema ยังไม่มีฟิลด์ ตอนต้องการแสดง "วงเงินคงเหลือ" ที่ tab 1 ต้องเพิ่มทั้ง field และ logic หัก
- **เครื่องหมายธนาคาร** — ตอนนี้ `bankId` เป็น text หลังต่อ admin banks table จะเปลี่ยนเป็น uuid + FK

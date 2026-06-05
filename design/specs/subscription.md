# หน้าสมาชิก/บริการ (route `/subscription`)

## ภาพรวม
จัดการ subscription ทั้งหมด — แยกชัดระหว่าง **template** (ข้อมูลต้นทาง) กับ **ledger** (รายการจ่ายจริงรายเดือน)

---

## Schema ใหม่: `subscription_templates`

> ตารางนี้แยกออกมาจาก `fixed_cost_templates` เพราะ subscription มี cycle + renew logic ต่างออกไป

```
subscription_templates
  id              uuid PK
  user_id         text  (FK → users, กรอง userId ทุก query)
  name            text  NOT NULL
  default_amount  decimal(12,2)  NOT NULL
  cycle           enum('monthly','yearly')  NOT NULL
  renew_month     int  NULLABLE  -- ใช้เฉพาะ cycle='yearly' (1–12)
  active          boolean  DEFAULT true
  note            text  NULLABLE
  created_at      timestamptz
  updated_at      timestamptz
```

**`ledger_entries` ที่ใช้ร่วม (ไม่ต้องสร้างใหม่)**
- `type = 'SUBSCRIPTION'`
- `source_type = 'subscription_template'`
- `source_id` = `subscription_templates.id`
- แก้ไข amount / ลบ = ทำที่ `ledger_entries` เท่านั้น ห้ามแก้ผ่าน template

---

## Layout

```
/subscription
├── page header: "สมาชิก/บริการ" + ปุ่ม "+ เพิ่มบริการ" (เปิด modal เพิ่ม template)
├── Tab 1: "รายการจ่ายรายเดือน"   ← ledger view
└── Tab 2: "รายการสมัคร"          ← template management
```

Tab style: underline เหมือน `/fix-cost` (active = navy bold + เส้นใต้หนา, inactive = gray)

---

## Tab 1 — รายการจ่ายรายเดือน

### ส่วนประกอบ (บนลงล่าง)

**Month navigator**
```
[ < ]  2026/06  [ > ]
```
- เปลี่ยนเดือนได้อิสระ
- ค่า default = เดือนปัจจุบัน

**Summary bar** (4 การ์ดแนวนอน)
| รวมทั้งหมด | จ่ายแล้ว | ค้างจ่าย | จำนวนรายการ |
- คำนวณจาก `ledger_entries` (filter userId + year + month + type=SUBSCRIPTION)
- อัปเดต real-time ทุกครั้งที่ toggle paid

**Import banner** (แสดงเมื่อมี active template ที่ยังไม่ได้ดึงเข้าเดือนนี้)
```
[ℹ] มีรายการสมัคร active X รายการ ยังไม่ได้ดึงเข้าเดือนนี้
                                    [ ดึงรายการ ]  [ ข้าม ]
```
- ซ่อนเมื่อ: ดึงครบแล้ว หรือกด "ข้าม" (dismiss เฉพาะเดือนนั้น)
- logic หา pending = active templates ที่ยังไม่มี ledger row ในเดือนนี้
  - monthly: ทุก active template
  - yearly: active template ที่ `renew_month === currentMonth`

**Import modal** (เปิดเมื่อกด "ดึงรายการ")
- title: "ดึงรายการสมัครเข้าเดือน YYYY/MM"
- subtitle: "เลือกรายการที่ต้องการบันทึกลง — สามารถแก้ไขจำนวนได้ภายหลัง"
- list: checkbox แต่ละ template (default = เลือกทั้งหมด), แสดงชื่อ + badge cycle + amount
- footer: [ ยกเลิก ] [ ดึงเข้ารายการ ]
- action: insert `ledger_entries` ทีละ row ต่อ template ที่เลือก
  ```
  type        = 'SUBSCRIPTION'
  source_type = 'subscription_template'
  source_id   = template.id
  name        = template.name
  amount      = template.default_amount  (แก้ได้ทีหลัง)
  year/month  = currentYear/currentMonth
  paid        = false
  ```

**รายการ ledger** (list แนวตั้ง)

แต่ละแถว:
```
[ □ ]  Netflix          [badge รายเดือน]     ฿201.00   [✏] [🗑]
       (ขีดฆ่า+dim เมื่อ paid)               ✓ จ่ายแล้ว 2026-06-01
```
- **checkbox** → toggle `paid` + `paid_at` → ขีดฆ่าชื่อ + dim แถว
- **✏ edit** → inline input แก้ `amount` → update `ledger_entries` (ไม่แตะ template)
- **🗑 delete** → ลบ row จาก `ledger_entries` (confirm dialog ก่อน)
- badge: `รายเดือน` (blue) / `รายปี` (amber) / `เพิ่มเอง` (gray) ตาม source

---

## Tab 2 — รายการสมัคร (Template management)

### ส่วนประกอบ

**Toolbar**
```
active X รายการ · inactive Y รายการ          [ + เพิ่มบริการ ]
```

**Section "Active (X)"** → list template ที่ active=true
**Section "Inactive (Y)"** → list template ที่ active=false (collapsed ได้)

แต่ละแถว template:
```
●  Netflix        รายเดือน    ฿201.00   [badge]   [toggle ●]   [✏]
```
- **dot**: สีเขียว = active, สีเทา = inactive
- **toggle switch**: สลับ `active` true/false → update `subscription_templates`
  - inactive = template ไม่โผล่ใน import banner เดือนถัดไป
  - **ไม่** ลบ ledger ที่ดึงไปแล้ว
- **✏ edit**: เปิด modal แก้ชื่อ / amount / cycle / renew_month / note
- รายปีแสดง "ต่ออายุเดือน X" ใต้ชื่อ

**Modal เพิ่ม/แก้ template**
Fields:
- ชื่อบริการ (text, required)
- จำนวนเงิน (number, required)
- รูปแบบ: รายเดือน / รายปี (radio/select)
- เดือนต่ออายุ (select 1–12, แสดงเฉพาะเมื่อเลือกรายปี)
- หมายเหตุ (text optional)
- [ ยกเลิก ] [ บันทึก ]

---

## Server Actions

```typescript
// subscription_templates
createSubscriptionTemplate(data)   → insert + revalidate
updateSubscriptionTemplate(id, data) → update + revalidate
toggleSubscriptionActive(id)       → toggle active field + revalidate

// ledger_entries (SUBSCRIPTION type)
importSubscriptionsToMonth(templateIds, year, month)  → bulk insert
updateSubscriptionLedgerAmount(ledgerId, amount)      → update amount only
toggleSubscriptionPaid(ledgerId)                      → toggle paid + paid_at
deleteSubscriptionLedger(ledgerId)                    → delete row
```

revalidatePath ทุก action: `'/subscription'`

---

## Data queries

```typescript
// Tab 1
getSubscriptionLedger(userId, year, month)
// → ledger_entries WHERE userId + year + month + type='SUBSCRIPTION'

getPendingTemplates(userId, year, month)
// → subscription_templates WHERE userId + active=true
//   ยกเว้น id ที่มี ledger row ในเดือนนั้นแล้ว
//   yearly: กรอง renew_month = month ด้วย

// Tab 2
getSubscriptionTemplates(userId)
// → subscription_templates WHERE userId ORDER BY active DESC, name ASC
```

---

## UI/UX notes
- เดือนเก็บเป็น `year` + `month` เหมือนหน้า fix-cost (ไม่ใช้ Date object ตรงๆ)
- ทุก mutation ผ่าน Server Action + zod validate ก่อน
- ไม่มี "ปิดรอบ" — แก้/ลบ ledger ได้ตลอด
- import banner dismiss = เก็บ state ใน component (ไม่ต้อง persist ใน DB)
- confirm dialog ก่อนลบ ledger ทุกครั้ง
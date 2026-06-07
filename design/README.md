# design/

โฟลเดอร์เก็บ **spec / wireframe / mock** ของ debt-tracker — ไม่ใช่ code production

## ใช้ทำอะไร

ก่อนลงมือทำ feature ใด ๆ ที่มี business logic ซับซ้อน (ผ่อน 0%/มีดอก, รอบบิล, auto-renew, import จาก template) ให้อ่าน spec ที่ตรงกับ route นั้นก่อนเสมอ — **ห้ามเดา logic** (กฎใน `CLAUDE.md`)

Spec เขียนตอนตัดสินใจ design ครั้งแรก — อาจมีบางจุดที่ code ปัจจุบันต่างจาก spec ไปแล้ว (วิวัฒน์ขึ้น) ถ้าเจอความขัดแย้ง: code = ความจริง, spec = เจตนาเดิม → ถามเจ้าของก่อนแก้ฝั่งใดฝั่งหนึ่ง

## โครงสร้าง

```
design/
├── README.md                          ← คุณอยู่ที่นี่
├── specs/                             ← spec รายโมดูล (อ่านก่อนลงมือ)
│   ├── monthly-cost.md                  /monthly-cost
│   ├── subscription.md                  /subscription
│   └── credit-cards/                    /credit-cards
│       ├── README.md                      overview + data model + cross-tab logic
│       ├── tab1-statement.md              tab "รายการชำระบัตรเครดิต"
│       ├── tab2-installment.md            tab "รายการผ่อนชำระ"
│       └── tab3-cards.md                  tab "บัตรของฉัน"
└── archive/                           ← UI mock เก่า ไม่ตรงกับของจริงแล้ว
    ├── mock.html                        HTML mock (dark theme, Tailwind CDN)
    └── prototype.jsx                    React prototype (recharts/lucide)
```

## Map spec → code

| Spec | Route | Code path |
|---|---|---|
| `specs/monthly-cost.md` | `/monthly-cost` | `src/app/(portal)/monthly-cost/`, `features/monthly-cost/` |
| `specs/subscription.md` | `/subscription` | `src/app/(portal)/subscription/`, `features/subscription/` |
| `specs/credit-cards/*` | `/credit-cards` | `src/app/(portal)/credit-cards/`, `features/credit-cards/` |

ยังไม่มี spec: `/dashboard`, `/ledger`, `/settings`, admin (`/banks`, `/categories`, `/users`) — ตอนนี้เป็น stub

## Convention ของ spec

- **เขียนเป็นภาษาไทย** (โปรเจกต์นี้ TH ก่อน)
- ใช้ Drizzle schema เป็น source of truth — ถ้า spec กล่าวถึงตาราง/field ให้ตรงกับ `src/db/schema/`
- ระบุ **route** บนหัวเสมอ
- แยก section: **Data model** · **Layout/Tabs** · **Logic** · **UI rules** · **Open questions**
- เงิน/เดือนตามกฎใน `CLAUDE.md` (Decimal(12,2) + `formatMoney`, `year`+`month` + `formatYearMonth`)

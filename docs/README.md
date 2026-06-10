# docs/

เอกสารทั้งหมดของ debt-tracker — runbook + spec + archive (ไม่ใช่ code production)

## ในนี้มีอะไร

```
docs/
├── README.md                          ← คุณอยู่ที่นี่ (index)
├── deployment.md                      ← runbook deploy production (Vercel + Supabase + OAuth)
├── specs/                             ← spec รายโมดูล (อ่านก่อนลงมือทำ feature)
│   ├── monthly-cost.md                  /monthly-cost
│   ├── subscription.md                  /subscription
│   └── credit-cards/                    /credit-cards (3 tabs)
│       ├── README.md                      overview + data model + cross-tab logic
│       ├── tab1-statement.md              tab "รายการชำระบัตรเครดิต"
│       ├── tab2-installment.md            tab "รายการผ่อนชำระ"
│       └── tab3-cards.md                  tab "บัตรของฉัน"
├── email-templates/                   ← เทมเพลตอีเมล (ใช้ที่ Supabase Dashboard)
│   └── reset-password.md
└── archive/                           ← UI mock เก่า ไม่ตรงกับของจริงแล้ว
    ├── mock.html                        HTML mock (dark theme, Tailwind CDN)
    └── prototype.jsx                    React prototype (recharts/lucide)
```

## ใช้ทำอะไร

- **`deployment.md`** — ก่อน deploy production / แก้ env / เพิ่ม OAuth provider อ่านอันนี้ก่อน
- **`specs/`** — ก่อนลงมือทำ feature ใด ๆ ที่มี business logic ซับซ้อน (ผ่อน 0%/มีดอก, รอบบิล, auto-renew, import จาก template) อ่าน spec ที่ตรงกับ route ก่อนเสมอ — **ห้ามเดา logic** (กฎใน `CLAUDE.md`)
- **`email-templates/`** — ตัวอย่าง HTML/text ของอีเมลที่ Supabase ส่ง (reset password ฯลฯ)
- **`archive/`** — mock เก่าตอน design รอบแรก เก็บไว้ดูเจตนา ไม่ใช่ source of truth

Spec เขียนตอนตัดสินใจ design ครั้งแรก — อาจมีจุดที่ code ปัจจุบันต่างจาก spec ไปแล้ว ถ้าเจอความขัดแย้ง: **code = ความจริง, spec = เจตนาเดิม** → ถามเจ้าของก่อนแก้ฝั่งใดฝั่งหนึ่ง

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

# docs/

เอกสารทั้งหมดของ debt-tracker — runbook + spec + archive (ไม่ใช่ code production)

## ในนี้มีอะไร

```
docs/
├── README.md                          ← คุณอยู่ที่นี่ (index)
├── deployment.md                      ← runbook deploy production (Vercel + Supabase + OAuth)
├── specs/                             ← spec รายโมดูล (อ่านก่อนลงมือทำ feature)
│   ├── dashboard/                       /dashboard (2 tabs · read-only)
│   │   ├── dashboard.md                   overview + data flow
│   │   ├── this-month-tab.md              tab "เดือนนี้ต้องจ่ายอะไรบ้าง"
│   │   └── overview-tab.md                tab "ภาพรวมรายจ่าย"
│   ├── recurring/                      /recurring (2 tabs · รวม fixed-cost + subscription)
│   │   ├── recurring.md                  overview + data flow + merge note
│   │   ├── month-tab.md                  tab "รายการเดือนนี้"
│   │   └── template-tab.md               tab "ตั้งค่ารายการประจำ"
│   ├── credit-cards/                    /credit-cards (3 tabs)
│   │   ├── credit-cards.md                overview + data model + cross-tab logic
│   │   ├── statement-tab.md               tab "รายการชำระบัตรเครดิต"
│   │   ├── installment-tab.md             tab "รายการผ่อนชำระ"
│   │   └── cards-tab.md                   tab "บัตรของฉัน"
│   ├── settings/                       /settings (profile + theme + logout)
│   │   └── settings.md                   overview + actions + AC
│   ├── ledger/                         /ledger (🚧 design · ยังไม่ build)
│   │   └── ledger.md                     design spec + open questions
│   ├── admin/                          /banks · /categories · /users (admin section)
│   │   └── admin.md                      role gating + 3 admin pages
│   ├── monthly-cost/  ⚠️ DEPRECATED    รวมเข้า recurring/ แล้ว (เก็บเป็น history)
│   └── subscription/  ⚠️ DEPRECATED    รวมเข้า recurring/ แล้ว (เก็บเป็น history)
├── email-templates/                   ← เทมเพลตอีเมล (ใช้ที่ Supabase Dashboard)
│   ├── README.md                        วิธีวาง + subject + หมายเหตุ
│   ├── confirm-signup.html              ยืนยันอีเมลตอนสมัคร
│   └── reset-password.html              ตั้งรหัสผ่านใหม่
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
| `specs/dashboard/*` | `/dashboard` | `src/app/(portal)/dashboard/`, `features/dashboard/`, `server/queries/dashboard.ts` |
| `specs/recurring/*` | `/recurring` | `src/app/(portal)/recurring/`, `features/recurring/`, `server/{queries,actions}/recurring-*.ts`, `ledger-entries.ts` |
| `specs/credit-cards/*` | `/credit-cards` | `src/app/(portal)/credit-cards/`, `features/credit-cards/` |
| `specs/settings/settings.md` | `/settings` | `src/app/(portal)/settings/`, `features/{profile,settings}/`, `server/actions/{profile,user-settings}.ts` |
| `specs/ledger/ledger.md` | `/ledger` | 🚧 stub `src/app/(portal)/ledger/page.tsx` — ยังไม่ build |
| `specs/admin/admin.md` | `/banks`, `/categories`, `/users` | `src/app/(portal)/{banks,categories,users}/`, `features/admin/`, `server/{queries,actions}/{banks,categories,users}.ts` |
| `specs/monthly-cost/*` · `specs/subscription/*` | ~~`/monthly-cost`~~ ~~`/subscription`~~ | ⚠️ DEPRECATED — รวมเข้า `/recurring` (commit `2ed81ff`) · เก็บเป็น history |

**ยังไม่มี spec:** ครบทุกหน้าที่ build แล้ว ✅
**Design spec (ยังเป็น stub):** `/ledger` — มี design spec + open questions รอเจ้าของเคาะ

## Convention ของ spec

- **เขียนเป็นภาษาไทย** (โปรเจกต์นี้ TH ก่อน)
- ใช้ Drizzle schema เป็น source of truth — ถ้า spec กล่าวถึงตาราง/field ให้ตรงกับ `src/db/schema/`
- ระบุ **route** บนหัวเสมอ
- แยก section: **Data model** · **Layout/Tabs** · **Logic** · **UI rules** · **Open questions**
- เงิน/เดือนตามกฎใน `CLAUDE.md` (Decimal(12,2) + `formatMoney`, `year`+`month` + `formatYearMonth`)

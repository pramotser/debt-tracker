# Debt Tracker

แอปติดตามหนี้/รายจ่ายส่วนตัวที่สร้างมาแทน Notion tracker — ใช้คนเดียวก่อน เผื่อขยาย

## Doc map

| File | ใช้ตอนไหน |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | กฎ + convention — อ่านก่อนเขียน code |
| [`docs/README.md`](./docs/README.md) | index ของ doc ทั้งหมด (spec / runbook / archive) |
| [`docs/specs/`](./docs/specs/) | spec รายโมดูล — อ่านก่อนทำ feature ที่มี business logic ซับซ้อน |
| [`docs/deployment.md`](./docs/deployment.md) | production runbook (Vercel + Supabase + OAuth) |

## Stack

- **Next.js 16** (App Router) + TypeScript + React 19
- **shadcn/ui + Tailwind v4** — UI เดียว ไม่มี MUI/aliases
- **Drizzle ORM** + drizzle-kit + drizzle-zod
- **Supabase Postgres** (transaction pooler 6543 runtime, session pooler 5432 migrate)
- **next-intl** (TH ก่อน)
- **zod**, **date-fns**, **sonner**
- Deploy: Vercel

## รันโลคอล

ใช้ Node ≥ 20 (Next 16 ต้องการ) — เครื่อง dev เครื่องนี้ default node v16 เลยต้องชี้ไปที่ node@24:

```bash
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm install
PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run dev
```

Scripts: `dev` · `build` · `start` · `lint`

ก่อน commit: `tsc --noEmit` ผ่าน + `npm run dev` ขึ้นได้

## โครงสร้างโปรเจกต์

```
src/
  app/
    (auth)/                    # login / register / forgot-password / reset-password
    (portal)/                  # routes หลังล็อกอิน
      dashboard/                 # ภาพรวม — 2 tabs (เดือนนี้ / ภาพรวม)
      monthly-cost/              # ค่าใช้จ่ายรายเดือน
      subscription/              # สมาชิก/บริการรายเดือน-ปี
      recurring/                 # รวม fixed-cost + subscription · CRUD template
      credit-cards/              # บัตรเครดิต 3 tabs (statement / installment / cards)
      settings/                  # โปรไฟล์ + ธีม + logout
      ledger/                    # (stub) รายการทั้งหมด
      banks/ categories/ users/  # admin pages (role gating)
    auth/callback/             # Supabase OAuth callback
  components/
    ui/                        # shadcn primitives
    layout/                    # portal-sidebar, etc
  features/<domain>/           # client components + dialogs per page
    credit-cards/  monthly-cost/  subscription/  recurring/  settings/  profile/  admin/
  server/
    actions/                   # Server Actions (mutations + revalidatePath)
    queries/                   # ดึงข้อมูล (server-only)
  db/
    schema/                    # Drizzle table definitions (users / user-settings / banks / categories / credit-cards / credit-card-installments / recurring-templates / ledger-entries)
    index.ts seed.ts
  lib/
    auth.ts                    # getCurrentUser() — Supabase Auth (throw ถ้าไม่ login)
    format.ts                  # formatMoney / formatYearMonth
    supabase/                  # browser + server clients
  messages/th.json             # i18n

docs/
  README.md                    # index ของ doc ทั้งหมด
  deployment.md                # production runbook
  specs/                       # spec ของแต่ละ module — อ่านก่อนลงมือ
    dashboard/  monthly-cost/  subscription/  credit-cards/  admin/
  email-templates/             # Supabase email templates
  archive/                     # UI mock เก่า (mock.html + prototype.jsx)
```

## Features

| Route | สถานะ | คำอธิบาย |
|---|---|---|
| `/dashboard` | ✅ | 2 tabs (เดือนนี้ / ภาพรวม) — read-only KPI + chart |
| `/monthly-cost` | ✅ | ค่าใช้จ่ายรายเดือน — template + month ledger + import |
| `/subscription` | ✅ | สมาชิกรายเดือน/ปี — auto-renew + import |
| `/recurring` | ✅ | รวม fixed-cost + subscription · CRUD template |
| `/credit-cards` | ✅ | บัตรเครดิต 3 tabs (statement / installment / cards) — BankPicker wired กับ DB banks |
| `/settings` | ✅ | โปรไฟล์ + ธีม + logout |
| `/ledger` | 🚧 stub | placeholder — ยังไม่ต่อ DB |
| `/banks` `/categories` `/users` | ✅ admin | role gating · CRUD ธนาคาร/หมวดหมู่ · list ผู้ใช้ (read-only) |
| `/(auth)/*` | ✅ | login · register · forgot-password · reset-password (Supabase Auth + Google OAuth) |

### `/credit-cards` 3 tabs

1. **รายการชำระบัตรเครดิต** — statement รายเดือน + เพิ่มรายการรูด + mark paid + auto-pull งวดผ่อนที่ตกในเดือนนั้น
2. **รายการผ่อนชำระ** — แผนผ่อนทั้งหมด แบ่ง active / near-end / completed / early-settled พร้อม drilldown รายงวด + ปิดก่อนกำหนด + รองรับผ่อน 0%/มีดอกแบบรู้-และไม่รู้-split
3. **บัตรของฉัน** — CRUD บัตร + toggle active

## Conventions

- **เงิน** = `Decimal(12,2)` — แสดงผลผ่าน `lib/format.ts` เสมอ (ห้าม hardcode สัญลักษณ์)
- **เดือน** = เก็บ `year` + `month` (1-12) — แสดง `YYYY/MM` เทียบด้วย `year*100+month`
- **query รายผู้ใช้** ต้องกรอง `userId` ผ่าน `getCurrentUser()`
- **mutation** = Server Action + `revalidatePath` + validate ด้วย zod
- **UI** = shadcn เท่านั้น โทนมน ขอบโค้ง การ์ดนุ่ม · รองรับ light/dark สลับใน `/settings` (เก็บใน `user_settings.theme`)
- **Role** = `admin` (Banks/Categories/Users) ไม่มี userId · `user` (Cards + transactional) มี userId

## Env

เก็บใน `.env.local` ที่เดียว — `drizzle.config.ts` โหลด `.env.local` เอง (drizzle-kit ไม่อ่านอัตโนมัติ)

- Runtime DB: transaction pooler **port 6543** + `pgbouncer=true`
- Migrate: session pooler **port 5432**
- อย่าใช้ Direct Connection (`db.xxx.supabase.co`) — IPv6 ต่อจากบ้านไม่ได้

Production deployment (Vercel env / Supabase / Google OAuth) → `docs/deployment.md`

## Workflow

- Branch ใหม่: `chore/<x>` · `feat/<x>` · `fix/<x>` — ห้ามแตะ `main`
- Commit message: Conventional Commits (`feat(cards): ...`)
- ไม่ push/PR เองจนกว่าเจ้าของจะอนุมัติ
- ทุก spec ของ module ซับซ้อนอยู่ที่ `docs/specs/` — อ่านก่อนลงมือเสมอ ห้ามเดา logic

ดู `CLAUDE.md` สำหรับกฎเฉพาะของ AI agent

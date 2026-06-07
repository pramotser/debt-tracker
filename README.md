# Debt Tracker

แอปติดตามหนี้/รายจ่ายส่วนตัวที่สร้างมาแทน Notion tracker — ใช้คนเดียวก่อน เผื่อขยาย

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
  app/(portal)/              # routes ทั้งหมด
    dashboard/                 # (stub) ภาพรวม
    monthly-cost/              # ค่าใช้จ่ายรายเดือน — ทำงานครบ
    subscription/              # สมาชิก/บริการรายเดือน-ปี — ทำงานครบ
    credit-cards/              # บัตรเครดิต 3 tabs — ทำงานครบ
    ledger/                    # (stub) รายการทั้งหมด
    settings/                  # (stub) ตั้งค่า
    banks/ categories/ users/  # (stub) admin pages
  components/
    ui/                        # shadcn primitives
    layout/                    # portal-sidebar, etc
  features/<domain>/           # client components + dialogs per page
    credit-cards/  monthly-cost/  subscription/
  server/
    actions/                   # Server Actions (mutations + revalidatePath)
    queries/                   # ดึงข้อมูล (server-only)
  db/
    schema/                    # Drizzle table definitions
    index.ts seed.ts
  lib/
    auth.ts                    # getCurrentUser() — dev คืน dev-01
    format.ts                  # formatMoney / formatYearMonth
  messages/th.json             # i18n

design/
  specs/                       # specs ของแต่ละ module — อ่านก่อนลงมือ
    credit.md                    # logic ผ่อนชำระ (0%/มีดอก/ปิดยอด)
    monthly-cost.md
    subscription.md
    tab/                         # spec รายแท็บของ /cards
  prototype.jsx mock.html      # UI mock
```

## Features

| Route | สถานะ | คำอธิบาย |
|---|---|---|
| `/monthly-cost` | ✅ | ค่าใช้จ่ายรายเดือน — template + month ledger + import |
| `/subscription` | ✅ | สมาชิกรายเดือน/ปี — auto-renew + import |
| `/credit-cards` | ✅ | บัตรเครดิต 3 tabs (statement / installment / mine) |
| `/dashboard` `/ledger` `/settings` | 🚧 stub | ยังไม่ทำ |
| `/banks` `/categories` `/users` | 🚧 stub | admin pages — ยังไม่ทำ |

### `/credit-cards` 3 tabs

1. **รายการชำระบัตรเครดิต** — statement รายเดือน + เพิ่มรายการรูด + mark paid + auto-pull งวดผ่อนที่ตกในเดือนนั้น
2. **รายการผ่อนชำระ** — แผนผ่อนทั้งหมด แบ่ง active / near-end / completed / early-settled พร้อม drilldown รายงวด + ปิดก่อนกำหนด + รองรับผ่อน 0%/มีดอกแบบรู้-และไม่รู้-split
3. **บัตรของฉัน** — CRUD บัตร + toggle active

## Conventions

- **เงิน** = `Decimal(12,2)` — แสดงผลผ่าน `lib/format.ts` เสมอ (ห้าม hardcode สัญลักษณ์)
- **เดือน** = เก็บ `year` + `month` (1-12) — แสดง `YYYY/MM` เทียบด้วย `year*100+month`
- **query รายผู้ใช้** ต้องกรอง `userId` ผ่าน `getCurrentUser()`
- **mutation** = Server Action + `revalidatePath` + validate ด้วย zod
- **UI** = shadcn เท่านั้น โทนมน ขอบโค้ง การ์ดนุ่ม (dark mode ทำทีหลัง)
- **Role** = `admin` (Banks/Categories/Users) ไม่มี userId · `user` (Cards + transactional) มี userId

## Env

เก็บใน `.env.local` ที่เดียว — `drizzle.config.ts` โหลด `.env.local` เอง (drizzle-kit ไม่อ่านอัตโนมัติ)

- Runtime DB: transaction pooler **port 6543** + `pgbouncer=true`
- Migrate: session pooler **port 5432**
- อย่าใช้ Direct Connection (`db.xxx.supabase.co`) — IPv6 ต่อจากบ้านไม่ได้

## Workflow

- Branch ใหม่: `chore/<x>` · `feat/<x>` · `fix/<x>` — ห้ามแตะ `main`
- Commit message: Conventional Commits (`feat(cards): ...`)
- ไม่ push/PR เองจนกว่าเจ้าของจะอนุมัติ
- ทุก spec ของ module ซับซ้อนอยู่ที่ `design/specs/` — อ่านก่อนลงมือเสมอ ห้ามเดา logic

ดู `CLAUDE.md` สำหรับกฎเฉพาะของ AI agent

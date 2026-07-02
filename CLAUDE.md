# CLAUDE.md

แอปติดตามหนี้/รายจ่ายส่วนตัว (ใช้คนเดียวก่อน เผื่อขยาย) — แทน Notion tracker

## Stack (ล็อก ห้ามเปลี่ยนเอง)
Next.js 16 App Router + TS · shadcn/ui + Tailwind v4 (UI เดียว ห้าม MUI) · Drizzle ORM (+drizzle-kit, drizzle-zod) · zod · date-fns · next-intl (TH ก่อน) · Supabase Postgres · Vercel

> Next.js 16 มี breaking changes จาก training data — อ่าน `node_modules/next/dist/docs/` ก่อนเขียน API/convention ใหม่ ห้ามเดา

## กฎย่อย (`.claude/rules/`) — อ่านก่อนเริ่มงานทุกครั้ง
- `git-workflow.md` — git flow, commit/push rule (**สำคัญสุด**)
- `code-style.md` — เงิน, เดือน, query/auth pattern, Read/Mutation pattern, UI/responsive convention, role
- `db-schema.md` — enums + ทุกตารางใน DB

## Layout
- `src/app/(auth)/<page>` — login · register · forgot-password · reset-password
- `src/app/(portal)/<page>` — dashboard · recurring · credit-cards · ledger · settings · **admin:** banks · categories · users
- `components/ui` (shadcn) + `components/layout`
- `features/<domain>` (UI/logic per module)
- `server/actions` (mutations) + `server/queries` (reads)
- `db/schema` + `db/index`
- `lib/{auth,format,supabase}` · `messages/th.json`

> Schema เต็ม (enums + ทุกตาราง) ย้ายไปอยู่ `.claude/rules/db-schema.md` แล้ว

## Module Status

**User:**
- ✅ `/dashboard` — 2 tabs (เดือนนี้ / ภาพรวม) · read-only chart + KPI
- ✅ `/recurring` — **รวม fixed-cost + subscription** (เดิม `/monthly-cost` + `/subscription` ถูกลบ · commit `2ed81ff`) · 2 tabs (รายการเดือนนี้ / ตั้งค่ารายการประจำ) · template + month ledger + import + 3-way amount edit
- ✅ `/credit-cards` — 3 tabs (statement / installment / cards) · BankPicker wired กับ DB banks
- ✅ `/settings` — profile + theme + logout
- ✅ `/ledger` — master view รวมทุก type · read-only + deep-link · filter (search/month-or-year/type/category/paid) · infinite scroll (cursor pagination · PAGE_SIZE=50) · summary aggregate · nav (sidebar + bottom-nav ช่องที่ 5)

**Admin (role gating · `notFound()` ถ้าไม่ใช่ admin):**
- ✅ `/banks` — CRUD ธนาคาร · brand colors · filter
- ✅ `/categories` — CRUD หมวดหมู่ · icon picker · filter
- ✅ `/users` — list ผู้ใช้ (read-only)

**Auth (Supabase Auth · cookie session):**
- ✅ `/(auth)/login` · `/register` · `/forgot-password` · `/reset-password`
- ✅ Google OAuth + email/password

> Credit installment = module ซับซ้อนสุด — อ่าน `docs/specs/credit-cards/credit-cards.md` ก่อน แล้วต่อ `installment-tab.md` ห้ามเดา logic

## Docs
- `docs/README.md` — index รวม
- `docs/specs/` — spec รายโมดูล (อ่านก่อนทำ feature ซับซ้อน)
- `docs/specs/dashboard/` — dashboard module (read-only):
  - `dashboard.md` — overview + 2 tabs + 8 queries
  - `this-month-tab.md` — KPI + progress + trend bar + monthly donut
  - `overview-tab.md` — upcoming line + all-time donut + category flow + installment progress + heatmap
- `docs/specs/recurring/` — recurring module (รวม fixed-cost + subscription):
  - `recurring.md` — overview + data flow + merge note
  - `month-tab.md` — รายการเดือนนี้ + import banner + 3-way amount edit
  - `template-tab.md` — CRUD รายการประจำ (รายเดือน/รายปี)
- `docs/specs/credit-cards/` — credit-cards module:
  - `credit-cards.md` — overview + tab structure + data flow
  - `statement-tab.md` — statement รายเดือน + add charge
  - `installment-tab.md` — แผนผ่อน logic ทั้งหมด
  - `cards-tab.md` — CRUD บัตร
- `docs/specs/settings/settings.md` — settings (profile + theme + logout)
- `docs/specs/ledger/ledger.md` — `/ledger` master view (read-only) · filter/search/sort · infinite scroll · type label + deep-link map · mock seed
- `docs/specs/admin/admin.md` — admin section (role gating + banks + categories + users)
- `docs/deployment.md` — production runbook

> 🗂️ **Deprecated specs:** `docs/specs/monthly-cost/` + `docs/specs/subscription/` — รวมเข้า `/recurring` แล้ว (commit `2ed81ff`) · เก็บเป็น history ไม่ใช่ source of truth

## Env
- `.env.local` ที่เดียว; `drizzle.config.ts` โหลดเอง
- runtime = transaction pooler **6543** (`pgbouncer=true`) · migrate = session pooler **5432**
- ห้ามใช้ Direct Connection (`db.xxx.supabase.co`) = IPv6 ต่อจากบ้านไม่ได้

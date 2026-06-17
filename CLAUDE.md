# CLAUDE.md

แอปติดตามหนี้/รายจ่ายส่วนตัว (ใช้คนเดียวก่อน เผื่อขยาย) — แทน Notion tracker

## Stack (ล็อก ห้ามเปลี่ยนเอง)
Next.js 16 App Router + TS · shadcn/ui + Tailwind v4 (UI เดียว ห้าม MUI) · Drizzle ORM (+drizzle-kit, drizzle-zod) · zod · date-fns · next-intl (TH ก่อน) · Supabase Postgres · Vercel

> Next.js 16 มี breaking changes จาก training data — อ่าน `node_modules/next/dist/docs/` ก่อนเขียน API/convention ใหม่ ห้ามเดา

## กฎเหล็ก (สำคัญสุด)
1. Git flow: `main` = production · `develop` = integration · feature branches `chore/feat/fix/perf/docs-<x>` แตกจาก `develop` แล้ว merge กลับ `develop` · `develop` → `main` ทำเมื่อเจ้าของยืนยัน — **ห้ามแตะ `main` ตรง ๆ**
2. เขียนเสร็จ → `npm run dev` ให้ขึ้น + `tsc` ผ่าน → commit ได้เลย (Conventional Commits) → สรุปสิ่งที่ทำ
3. **ห้าม push / เปิด PR เอง** จนกว่าเจ้าของยืนยัน
4. ตรวจก่อน commit: ไม่มี `.env*`/secret หลุด

## Conventions
- เงิน = `numeric(12,2)`; แสดงผลผ่าน `lib/format.ts` เสมอ (ห้าม hardcode สัญลักษณ์เงิน)
- เดือน = เก็บ `year` + `month` (1-12); แสดง `YYYY/MM`; เทียบด้วย `year*100+month`
- query ข้อมูลราย user ต้องกรอง `userId` ผ่าน `lib/auth.ts` → `getCurrentUser()` (Supabase Auth · throw ถ้าไม่ login)
- **Read** = Server Component เรียก `server/queries` โดยตรง
- **Mutation** = Server Action (`server/actions`) + `revalidatePath` + validate ด้วย zod ทุกครั้ง
- UI: shadcn เท่านั้น โทนมน ขอบโค้ง การ์ดนุ่ม
- Responsive: mobile-first ทุกหน้า · default stack 1 col → `sm:` (≥640px) ขยายเป็นหลาย col / row · เทสต์ที่ ~375px ก่อน commit · ห้ามเลข/ยอดเงิน wrap แตกบรรทัด · ห้ามพึ่ง `flex-wrap` เป็น mobile layout — ใช้ `flex-col sm:flex-row` ชัดเจน
- Role: `admin` = Banks/Categories/Users (ไม่มี userId) · `user` = Cards + ตาราง transactional (มี userId)

## Layout
- `src/app/(auth)/<page>` — login · register · forgot-password · reset-password
- `src/app/(portal)/<page>` — dashboard · monthly-cost · subscription · recurring · credit-cards · ledger · settings · **admin:** banks · categories · users
- `components/ui` (shadcn) + `components/layout`
- `features/<domain>` (UI/logic per module)
- `server/actions` (mutations) + `server/queries` (reads)
- `db/schema` + `db/index`
- `lib/{auth,format,supabase}` · `messages/th.json`

## Schema

### Enums
- `ledger_entry_type`: `FIXED_COST` | `SUBSCRIPTION` | `CREDIT_CARD` | `CREDIT_CARD_INSTALLMENT` | `ONE_TIME_COST`
- `cycle_type`: `monthly` | `yearly` (ใช้กับ `recurring_templates`)
- `installment_status`: `active` | `early_settled` (completed/near-end = derive ฝั่ง UI)
- `user_role`: `admin` | `user`

### users — บัญชีผู้ใช้ (id ตรงกับ auth.users.id ของ Supabase Auth)
- id: uuid PK · firstName: text · middleName: text? · lastName: text
- role: user_role (default user) · createdAt/updatedAt: timestamptz

### user_settings — ตั้งค่ารายผู้ใช้
- id: uuid PK · userId: FK→users · currency: text (THB) · language: text (th) · theme: text (light)

### banks — ⭐ admin · ธนาคารกลาง (global, ไม่ผูก user)
- id: text PK (slug `b-<short>` เช่น `b-kbank`) · shortName: text · name: text
- brandBg: text (#hex) · brandFg: text (#hex) · active: bool · sortOrder: int
- `credit_cards.bankId` → `banks.id` (logical, ไม่มี FK formal)

### categories — ⭐ admin · หมวดหมู่กลาง (global, แชร์ทุก user)
- id: text PK · name: text · icon: text (Lucide name) · colorBg: text · colorFg: text
- ownerId: uuid? (NULL = catalog ระบบ · != NULL = user สร้างเอง — เผื่ออนาคต)
- isSystem: bool (system = ลบไม่ได้) · sortOrder: int · active: bool
- `ledger_entries.categoryId` / `recurring_templates.categoryId` อ้างเป็น text เปล่า (ไม่มี FK — ตั้งใจ)

### credit_cards — บัตรเครดิตของ user
- id: uuid PK · userId: FK→users · bankId: text (logical → banks.id) · name: text
- lastFourDigits: text? · cardNetwork: text? · statementDate: int? (1-31) · dueDate: int? (1-31)
- color: text (default "blue") · active: bool

### credit_card_installments — แผนผ่อน (ledger rows generate ตอน create)
- id: uuid PK · userId: FK→users · creditCardId: FK→credit_cards (restrict) · categoryId: text
- name: text · totalAmount: numeric(12,2) · installmentAmount: numeric(12,2) ต่องวด
- installmentPrincipal: numeric? · installmentInterest: numeric? (NULL = mode 3 ยังไม่รู้ split)
- totalInstallments: int · startYear: int · startMonth: int (1-12)
- hasInterest: bool · status: installment_status (default active)
- settlementAmount: numeric? · closedAt: timestamptz?

### recurring_templates — template รายจ่ายประจำ (รวม fixed cost + subscription)
- id: uuid PK · userId: FK→users · categoryId: text · name: text
- defaultAmount: numeric(12,2)? (NULL ได้ — กรอกทีหลังแบบค่าไฟ)
- billingCycle: cycle_type (default `monthly` · `yearly` = renew เฉพาะเดือนตรงตาม renewDate)
- renewDate: date? (monthly=day, yearly=month+day) · active: bool

### ledger_entries — ตารางกลางรายจ่ายจริงทุกประเภท ⭐
- id: uuid PK · userId: FK→users · categoryId: text
- sourceType: text? (เช่น "recurring_template") · sourceId: text? (id ต้นทาง)
- type: ledger_entry_type · name: text
- amount: numeric? (ยอดรวม) · principalAmount: numeric? · interestAmount: numeric? (ใช้กับผ่อน)
- year: int · month: int (1-12) · paid: bool · paidAt: timestamptz? · note: text?
- index: (userId, year, month, type) · (sourceType, sourceId)

> ⚠️ `categoryId` ใน ledger/templates เป็น text เปล่า (ไม่มี FK formal) — ตั้งใจให้ join ฝั่ง app ห้ามเปลี่ยน type เป็น uuid · `bankId` ใน credit_cards = logical FK → `banks.id` (ตอนนี้มีตารางจริงแล้ว)

## Module Status

**User:**
- ✅ `/dashboard` — 2 tabs (เดือนนี้ / ภาพรวม) · read-only chart + KPI
- ✅ `/monthly-cost` — ค่าใช้จ่ายรายเดือน · template + month ledger
- ✅ `/subscription` — รายเดือน/รายปี · auto-renew + import
- ✅ `/recurring` — รวม fixed-cost + subscription · CRUD template
- ✅ `/credit-cards` — 3 tabs (statement / installment / cards) · BankPicker wired กับ DB banks
- ✅ `/settings` — profile + theme + logout
- 🚧 `/ledger` — stub (placeholder, ยังไม่ต่อ DB)

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
- `docs/specs/monthly-cost/` — monthly-cost module:
  - `monthly-cost.md` — overview + 2 tabs + data flow
  - `month-tab.md` — รายการจ่ายรายเดือน + import banner
  - `template-tab.md` — CRUD template จ่ายประจำ
- `docs/specs/subscription/` — subscription module:
  - `subscription.md` — overview + 2 tabs + renewDate semantics
  - `month-tab.md` — รายการจ่ายรายเดือน + import banner
  - `template-tab.md` — CRUD บริการ subscription (รายเดือน/รายปี)
- `docs/specs/credit-cards/` — credit-cards module:
  - `credit-cards.md` — overview + tab structure + data flow
  - `statement-tab.md` — statement รายเดือน + add charge
  - `installment-tab.md` — แผนผ่อน logic ทั้งหมด
  - `cards-tab.md` — CRUD บัตร
- `docs/specs/admin/admin.md` — admin section (role gating + banks + categories + users)
- `docs/deployment.md` — production runbook

> ⚠️ **Spec ที่ขาด:** `/recurring` · `/settings` · `/ledger` — หน้าทำแล้ว (ยกเว้น ledger) แต่ยังไม่มี spec · จะ backfill ใน sprint ถัดไป

## Env
- `.env.local` ที่เดียว; `drizzle.config.ts` โหลดเอง
- runtime = transaction pooler **6543** (`pgbouncer=true`) · migrate = session pooler **5432**
- ห้ามใช้ Direct Connection (`db.xxx.supabase.co`) = IPv6 ต่อจากบ้านไม่ได้

# CLAUDE.md

แอปติดตามหนี้/รายจ่ายส่วนตัว (ใช้คนเดียวก่อน เผื่อขยาย) — แทน Notion tracker

## Stack (ล็อก ห้ามเปลี่ยนเอง)
Next.js App Router + TS · shadcn/ui + Tailwind v4 (UI เดียว ห้าม MUI) · Drizzle ORM (+drizzle-kit, drizzle-zod) · zod · date-fns · next-intl (TH ก่อน) · Supabase Postgres · Vercel

## กฎเหล็ก (สำคัญสุด)
1. ทำบน branch `chore/feat/fix-<x>` เท่านั้น ห้ามแตะ `main`
2. เขียนเสร็จ → `npm run dev` ให้ขึ้น + `tsc` ผ่าน → commit ได้เลย (Conventional Commits) → สรุปสิ่งที่ทำ
3. **ห้าม push / เปิด PR เอง** จนกว่าเจ้าของยืนยัน (commit local ได้ แต่ของห้ามออก remote)
4. ตรวจก่อน commit: ไม่มี `.env*`/secret หลุด

## Conventions
- เงิน = `Decimal(12,2)`; แสดงผลผ่าน `lib/format.ts` เสมอ (ห้าม hardcode สัญลักษณ์เงิน)
- เดือน = เก็บ `year` + `month` (1-12); แสดง `YYYY/MM`; เทียบด้วย `year*100+month`
- query ข้อมูลราย user ต้องกรอง `userId` ผ่าน `lib/auth.ts` → `getCurrentUser()` (dev คืน `dev-01`)
- mutation = Server Action + `revalidatePath` + validate ด้วย zod
- UI: shadcn เท่านั้น โทนมน ขอบโค้ง การ์ดนุ่ม (dark mode ทำทีหลัง)
- Role: `admin` = Banks/Categories/Users (ไม่มี userId) · `user` = Cards + ตาราง transactional (มี userId)

## Layout
`src/app/(portal)/<page>` · `components/ui` (shadcn) + `components/layout` · `features/<domain>` · `server/actions` + `server/queries` · `db/schema` + `db/index` · `lib/{auth,format}` · `messages/th.json`

## Env
- เก็บใน `.env.local` ที่เดียว; `drizzle.config.ts` โหลด `.env.local` เอง (drizzle-kit ไม่อ่านอัตโนมัติ)
- runtime = transaction pooler **6543** (`pgbouncer=true`) · migrate = session pooler **5432**
- อย่าใช้ Direct Connection (`db.xxx.supabase.co`) = IPv6 ต่อจากบ้านไม่ได้

## สถานะตอนนี้
ต่อ Supabase Postgres + Drizzle เรียบร้อย — features หลักทำงาน end-to-end:
- `/monthly-cost` — ค่าใช้จ่ายรายเดือน (เพิ่ม/แก้/import template)
- `/subscription` — รายเดือน/รายปี (auto-renew, import)
- `/credit-cards` — 3 tabs:
  - "รายการชำระบัตรเครดิต" — statement รายเดือน + add charge
  - "รายการผ่อนชำระ" — แผนผ่อนทั้งหมด (active / near-end / completed / early-settled) + drilldown รายงวด + ปิดก่อนกำหนด
  - "บัตรของฉัน" — CRUD บัตร
- ยังไม่ทำ: `/dashboard`, `/ledger`, `/settings`, admin pages (`/banks`, `/categories`, `/users`) เป็น stub

Routes layout: route `/installment` เดิม ถูกย้ายเป็น tab ของ `/credit-cards` แล้ว — server actions ใน `credit-card-installments.ts` revalidate `/credit-cards`

Credit Cost/Installment = module ซับซ้อนสุด (ผ่อน 0%/มีดอก/ปิดยอด) — spec ที่ `design/specs/credit-cards/` (อ่าน `README.md` ก่อน แล้วต่อด้วย `tab2-installment.md` สำหรับ logic ผ่อน) ห้ามเดา logic

ดู `design/README.md` สำหรับ map spec → route และ convention ของ spec
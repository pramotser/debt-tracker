---
name: code-review-checklist
description: Project-specific checklist to apply on top of the generic /code-review skill when reviewing diffs in this repo (debt-tracker). Use whenever running /code-review here, or manually reviewing a PR/diff that touches src/app/(portal)/, src/features/, server/actions/, server/queries/, or src/db/schema/ — catches convention violations that a generic reviewer wouldn't know about.
---

# code-review-checklist (debt-tracker)

เสริม `/code-review` ทั่วไป — เช็คจุดที่เป็น convention เฉพาะโปรเจกต์นี้ (`.claude/rules/code-style.md`, `.claude/rules/db-schema.md`) ที่ generic reviewer ไม่รู้

## Money / Month

- ยอดเงินทุกจุด render ผ่าน `lib/format.ts` (`formatMoney`) — ห้าม hardcode สัญลักษณ์เงินหรือ `.toFixed()` เอง
- เดือน/ปีเทียบกันต้องใช้ `year*100+month` ไม่ใช่ string compare หรือ `Date` object
- ตัวเปลี่ยนเดือน (`[<] YYYY/MM [>]`) ต้องใช้ `components/layout/month-nav.tsx` — flag ทันทีถ้าเจอ chevron/label ที่เขียนเอง inline

## Read/Mutation pattern

- Read = Server Component เรียก `server/queries` ตรง ๆ (ไม่มี fetch client-side เกินจำเป็น)
- Mutation = ต้องเป็น Server Action ใน `server/actions` + `revalidatePath` ที่ path ถูกต้อง + validate ด้วย zod **ทุกครั้ง** — flag mutation ที่ข้าม zod หรือลืม revalidate

## Auth / scope

- query/action ที่เป็นข้อมูลราย user ต้อง filter `userId` ผ่าน `getCurrentUser()` (`lib/auth.ts`) — ไม่ใช่รับ `userId` จาก client input
- route ใน `(portal)` ฝั่ง admin (banks/categories/users) ต้องเช็ค `role === 'admin'` แล้ว `notFound()` ถ้าไม่ใช่ — ไม่ใช่แค่ซ่อน UI

## Schema-specific gotcha

- `categoryId` / `bankId` เป็น text เปล่า **ตั้งใจไม่มี FK formal** — ห้าม flag ว่าควรเพิ่ม FK constraint หรือเปลี่ยน type เป็น uuid (ผิดเจตนา ดู `.claude/rules/db-schema.md`)
- `ledger_entries` เป็นตารางกลางของทุก type — mutation ที่แตะตารางนี้ต้อง filter ด้วย `type` + `sourceType`/`sourceId` (`pageScope`) ให้ครบ ไม่งั้นข้าม type อื่นโดยไม่ตั้งใจ (ดู bug เดิมที่ `recurring.md` เคยแก้ไปแล้ว — อย่าให้เกิดซ้ำในโมดูลอื่น)
- แผนผ่อน (`credit_card_installments`) = logic ซับซ้อนสุด — ถ้า diff แตะไฟล์นี้ ต้องเทียบกับ `docs/specs/credit-cards/installment-tab.md` ก่อน approve ไม่เดา logic เอง

## Responsive

- ห้ามใช้ `flex-wrap` เป็น mobile layout — ต้องเป็น `flex-col sm:flex-row` ชัดเจน
- เลข/ยอดเงินต้องไม่ wrap แตกบรรทัดที่ ~375px

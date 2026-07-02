---
name: security-review-checklist
description: Project-specific checklist to apply on top of the generic /security-review skill for this repo (debt-tracker). Use whenever running /security-review here, or manually auditing a diff that touches auth (lib/auth.ts), server/actions, server/queries, admin routes, or anything reading Supabase env/secrets — catches auth/authorization gaps specific to this app's per-user + role model.
---

# security-review-checklist (debt-tracker)

เสริม `/security-review` ทั่วไป — โฟกัสจุดที่เป็นความเสี่ยงเฉพาะของ auth/authorization model โปรเจกต์นี้

## Per-user data isolation

- ทุก query/action ที่แตะข้อมูลราย user (`credit_cards`, `credit_card_installments`, `recurring_templates`, `ledger_entries`) ต้อง filter `userId` จาก `getCurrentUser()` ฝั่ง server เท่านั้น — **ไม่ใช่รับ userId/id เป้าหมายจาก client แล้วเชื่อตรง ๆ**
- action ที่รับ `id` (เช่น `deleteRecurringTemplate(id)`, `toggleRecurringPaid(id)`) ต้อง verify ว่า row นั้นเป็นของ user ปัจจุบันจริง (WHERE `userId = currentUser.id AND id = ...`) — ไม่ใช่ WHERE ด้วย `id` อย่างเดียว (ช่อง IDOR ถ้า id เป็น uuid เดาไม่ได้ก็ยังต้อง enforce เพราะ user อื่น login แล้วยิง action ตรงได้)
- bulk action เช่น `importRecurringToMonth(ids, y, m)` — ต้อง verify **ทุก id** ใน array เป็นของ user นี้ ไม่ใช่ trust ทั้ง array

## Admin gating

- `/banks` `/categories` `/users` ต้องเช็ค `role === 'admin'` **ฝั่ง server** (page.tsx หรือ layout) แล้ว `notFound()` — เช็คแค่ฝั่ง client (ซ่อนเมนู) ไม่พอ
- server action ของ admin (create/update/delete banks, categories) ต้องเช็ค role ซ้ำในตัว action เอง ไม่ใช่พึ่งแค่ page gating (เผื่อ action ถูกเรียกตรงข้าม flow ปกติ)

## Input validation

- ทุก Server Action ต้อง validate ด้วย zod ก่อนแตะ DB — ไม่มี action ไหน trust `formData`/param ดิบจาก client
- ตรวจ bound ของยอดเงิน (เช่น ห้ามติดลบไม่มีเหตุผล, ห้ามเกินขอบเขต `numeric(12,2)`) โดยเฉพาะจุดที่ user กรอกเอง (installment amount, one-time cost)

## Secrets / env

- ไม่มี connection string, Supabase service role key, หรือ `.env*` หลุดใน diff
- ต่อ DB ต้องผ่าน pooler (runtime = 6543 `pgbouncer=true`, migrate = 5432) เท่านั้น — flag ถ้าเห็น Direct Connection (`db.xxx.supabase.co`) หลุดเข้ามาในโค้ดหรือ config

## Schema-intentional gaps (อย่า false-positive)

- `categoryId`/`bankId` ไม่มี FK formal — เป็นการตัดสินใจโดยตั้งใจ ไม่ใช่ security bug แต่ถ้าเจอจุดที่ app **ไม่ validate** ว่า id ที่ user ส่งมาอยู่ใน catalog จริง (เช่น insert `categoryId` ที่ไม่มีอยู่จริงได้ตรง ๆ) อันนี้ flag ได้ — เป็นคนละเรื่องกับ FK constraint

# Settings — spec

route `/settings` · ตั้งค่ารายผู้ใช้ — 3 การ์ด: ข้อมูลส่วนตัว · ธีม · ออกจากระบบ

## Overview

หน้า server component (`src/app/(portal)/settings/page.tsx`) `Promise.all([getCurrentUser(), getUserSettings()])` แล้ว render 3 การ์ดเรียงแนวตั้ง · ทุก mutation = Server Action + zod validate

## User story

ในฐานะ user ฉันอยากแก้ชื่อที่แสดง · สลับธีมสว่าง/มืด · และออกจากระบบ ได้จากหน้าเดียว

## Layout

```
┌──────────────────────────────────────┐
│ ข้อมูลส่วนตัว                          │
│  อีเมล   [📧 user@example.com] (อ่านอย่างเดียว) │
│  ชื่อ    [____]                        │
│  ชื่อกลาง [____] (ถ้ามี)                │
│  นามสกุล [____]                        │
│  [บันทึก]                              │
├──────────────────────────────────────┤
│ ธีม                                    │
│  [Light ▾]  (Light / Dark / System)   │
├──────────────────────────────────────┤
│ ออกจากระบบ  (การ์ดขอบ destructive)      │
│  [🚪 ออกจากระบบ]                        │
└──────────────────────────────────────┘
```

## การ์ด 1 — ข้อมูลส่วนตัว (`ProfileForm`)

`src/features/profile/profile-form.tsx` · `useActionState(updateProfile)`

| ฟิลด์ | type | required | validation |
|---|---|---|---|
| อีเมล | แสดงผล (อ่านอย่างเดียว) | — | `user.email` จาก Supabase Auth · ไม่มี input · "—" ถ้าไม่มี |
| ชื่อ | text | ✓ | `trim().min(1)` · `max(50)` · autoComplete `given-name` |
| ชื่อกลาง | text | — | optional · `max(50)` · autoComplete `additional-name` |
| นามสกุล | text | ✓ | `trim().min(1)` · `max(50)` · autoComplete `family-name` |

- ปุ่ม `บันทึก` (disabled ตอน pending → "กำลังบันทึก...")
- สำเร็จ → ข้อความ "บันทึกแล้ว" (เขียว) · error → ข้อความแดงจาก action
- **Action:** `updateProfile(prev, formData)` (`src/server/actions/profile.ts`) — zod `profileSchema` → คืน `{ ok: true }` / `{ error }` · `revalidatePath('/settings')` + `revalidatePath('/', 'layout')` (อัปเดตชื่อใน sidebar)

## การ์ด 2 — ธีม (`ThemeForm`)

`src/features/settings/theme-form.tsx` · ใช้ `next-themes` (`useTheme`) + persist DB

- Select 3 ตัวเลือก: `Light` · `Dark` · `System (ตามอุปกรณ์)`
- **บันทึกอัตโนมัติ** ตอนเปลี่ยน (ไม่มีปุ่ม) → `setTheme(v)` (next-themes ทันที) + `updateTheme(v)` (persist) · toast "บันทึกธีมแล้ว" / error
- กัน hydration mismatch: ก่อน `mounted` ใช้ `initialTheme` จาก DB · Select disabled จน mounted
- **Action:** `updateTheme(theme)` (`src/server/actions/user-settings.ts`) — zod enum `["light","dark","system"]` · **upsert** (insert row ถ้ายังไม่มี) · `revalidatePath('/', 'layout')`

## การ์ด 3 — ออกจากระบบ

- การ์ดขอบ `border-destructive/40`
- `<form action={signOut}>` → ปุ่ม destructive "ออกจากระบบ" (`src/server/actions/auth.ts` `signOut`)

## Data dependency

- `getCurrentUser()` (`lib/auth.ts`) → `firstName / middleName / lastName / email / role`
- `getUserSettings()` (`server/queries/user-settings.ts`) → `{ currency, language, theme }` · **upsert-on-read** (สร้าง default row ถ้ายังไม่มี)
- ตาราง: `users` (ชื่อ) · `user_settings` (theme) · Supabase Auth (email)

## Acceptance criteria

- [x] แก้ชื่อ → กดบันทึก → persist + sidebar อัปเดตชื่อทันที
- [x] ชื่อ/นามสกุลว่าง → error (ไม่ผ่าน zod)
- [x] เปลี่ยนธีม → มีผลทันที + persist ข้าม session
- [x] email แสดงอ่านอย่างเดียว แก้ไม่ได้
- [x] ออกจากระบบ → กลับไปหน้า login

## Out of scope (ยังไม่ทำ)

- แก้ `currency` / `language` ผ่าน UI (มีใน `user_settings` แต่ยังไม่มี control — ใช้ default THB / th)
- เปลี่ยนรหัสผ่าน / จัดการ session อุปกรณ์อื่น
- ลบบัญชี (self-service delete)

## Open questions

- จะเปิดให้เลือก currency/language เมื่อแอปรองรับหลายสกุล/หลายภาษาจริง (ตอนนี้ TH/THB อย่างเดียว) — รอ requirement

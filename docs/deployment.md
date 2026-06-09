# Production Deployment

Runbook สำหรับ deploy debt-tracker ขึ้น production (Vercel + Supabase + Google OAuth) — โฟกัสเรื่อง env / config ที่ต้องตั้งให้ครบ ไม่งั้น auth flow จะพัง

## Vercel Environment Variables

ตั้งที่ Vercel Dashboard → Project → Settings → Environment Variables (เลือก scope **Production**)

| Key | Value | Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase Dashboard → Project Settings → Data API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (JWT) | Supabase Dashboard → Project Settings → API Keys → anon public |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (ไม่มี `/` ท้าย) | URL จริงของ production deployment |
| `DATABASE_URL` | transaction pooler **port 6543** + `pgbouncer=true` | Supabase Dashboard → Database → Connection string |

> ⚠️ **`NEXT_PUBLIC_*` ถูก inline ตอน build** — แก้ค่าแล้วต้อง **Redeploy** ถึงจะมีผล (กด Deployments → ⋯ → Redeploy ตัวล่าสุด) เปลี่ยน env เฉย ๆ ไม่พอ

> เทียบกับ `.env.local` ของเครื่อง dev ได้เลย — `NEXT_PUBLIC_SUPABASE_URL` กับ `ANON_KEY` ใช้ค่าเดียวกันได้ (ไม่ใช่ secret) · ส่วน `NEXT_PUBLIC_SITE_URL` ใน dev ไม่ต้อง set (code fallback เป็น `http://localhost:3000` ที่ `src/server/actions/auth.ts`)

## Google OAuth Setup

### Flow diagram

```
[1] User กด "Login with Google"
    https://<app-domain>/login
              │
              │  signInWithOAuth({ redirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/callback` })
              ▼
[2] App → Supabase Auth
    https://<project-ref>.supabase.co/auth/v1/authorize?...
              │
              │  Supabase จำ redirect_to ไว้ → ส่งต่อไป Google
              ▼
[3] Supabase → Google (login + consent)
    https://accounts.google.com/o/oauth2/v2/auth?...
              │
              ▼
[4] Google → Supabase (callback)
    https://<project-ref>.supabase.co/auth/v1/callback?code=...
              │
              │  Supabase แลก code เป็น session → เด้งต่อ
              ▼
[5] Supabase → App (callback)
    https://<app-domain>/auth/callback?code=...
              │
              │  Route handler exchange code → set cookie
              ▼
[6] redirect ไป /dashboard ✅
```

### Config matrix (อะไรอยู่ตรงไหนของ flow)

| Hop | ต้อง config | ที่ |
|---|---|---|
| 1→2 | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SITE_URL` | **Vercel** env (ดูตารางบน) |
| 2→3 | Google OAuth Client ID + Secret | **Supabase** Dashboard → Authentication → Providers → Google |
| 3→4 | Google ยอม redirect กลับ Supabase | **Google Cloud Console** → APIs & Services → Credentials → OAuth Client → Authorized redirect URIs |
| 4→5 | Supabase ยอม redirect ไป app domain (whitelist) | **Supabase** Dashboard → Authentication → URL Configuration |
| 5→6 | Route handler ใน app | `src/app/auth/callback/route.ts` (มีอยู่แล้ว) |

### Supabase Dashboard → Authentication → URL Configuration

- **Site URL** (ช่องเดี่ยว — ใช้เป็น default redirect เวลา `redirectTo` ไม่ผ่าน whitelist + ใช้ใน email template):
  ```
  https://<app-domain>
  ```
  ไม่มี `/` ท้าย — Supabase จะเอาไปต่อ path เช่น `${SITE_URL}/auth/callback` ถ้ามี `/` จะกลายเป็น `//auth/callback`

- **Redirect URLs** (whitelist — ใส่ได้หลายอัน):
  ```
  https://<app-domain>/auth/callback
  http://localhost:3000/**
  ```
  Wildcard `**` ครอบคลุม dev ทุก path ใช้ตัวเดียวพอ

### Google Cloud Console → OAuth Client

**Authorized redirect URIs** ต้องมี:
```
https://<project-ref>.supabase.co/auth/v1/callback
```

⚠️ ไม่ใช่ app domain — เป็น Supabase project domain (เพราะ Google redirect กลับ Supabase ก่อน แล้ว Supabase ค่อยส่งต่อ app)

## Troubleshooting

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| Login → เด้งกลับ `localhost:3000` | `NEXT_PUBLIC_SITE_URL` ไม่ได้ set บน Vercel (code fallback เป็น localhost) หรือ set แล้วแต่ยังไม่ redeploy | ตั้ง env + Redeploy |
| URL `/auth/v1/authorize` ขึ้นบน vercel domain แทน supabase domain | `NEXT_PUBLIC_SUPABASE_URL` ตั้งเป็น vercel domain ผิด | ตั้งเป็น `https://<project-ref>.supabase.co` + Redeploy |
| Google error `redirect_uri_mismatch` | Authorized redirect URI ใน Google Cloud Console ไม่ตรง | เพิ่ม `https://<project-ref>.supabase.co/auth/v1/callback` |
| Supabase error `invalid redirect URL` | redirect URL ไม่อยู่ใน whitelist | เพิ่ม `https://<app-domain>/auth/callback` ใน Redirect URLs |
| Email confirm/reset password link เด้งไป localhost | Site URL ใน Supabase ยังเป็น localhost | เปลี่ยน Site URL เป็น app domain |

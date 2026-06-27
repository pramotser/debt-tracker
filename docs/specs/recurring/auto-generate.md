# Recurring — auto-generate (Vercel Cron)

สร้าง ledger ของรายการประจำให้อัตโนมัติทุกต้นเดือน — ไม่ต้องกด "ดึงเข้าเดือนนี้" เอง

## Flow

```
Vercel Cron (วันที่ 1 · 00:05 UTC = 07:05 ไทย)
  └─ GET /api/cron/recurring  (Authorization: Bearer CRON_SECRET)
       └─ loop ทุก user → generateRecurringForMonth(userId, year, month)
            └─ คัด template active + ถึงกำหนด → insertRecurringEntries (dedupe)
```

## ไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `src/server/recurring/generate.ts` | helper กลาง — `isTemplateDueInMonth` · `insertRecurringEntries` (dedupe+insert) · `generateRecurringForMonth` |
| `src/app/api/cron/recurring/route.ts` | route ที่ cron ยิง · ตรวจ `CRON_SECRET` · คำนวณปี/เดือนตามเวลาไทย · loop users |
| `vercel.json` | `crons: [{ path: "/api/cron/recurring", schedule: "5 0 1 * *" }]` |

## กฎสำคัญ

- **Idempotent** — dedupe ด้วย `(sourceType='recurring_template', sourceId, year, month)` รันซ้ำไม่สร้างซ้ำ
- **เคารพ template** — `active=false` ข้าม · `yearly` ลงเฉพาะเดือนตรง `renewDate` · monthly ทุกเดือน
- **ใช้ logic ร่วมกับ manual import** — `importRecurringToMonth` เรียก `insertRecurringEntries` ตัวเดียวกัน (import = ตามที่ผู้ใช้เลือก · auto = ตาม due)
- `amount = template.defaultAmount` (NULL ได้ = "แตะเพื่อกรอก")
- ทุก row ลง `type=FIXED_COST` + `sourceType='recurring_template'`

## Env ที่ต้องตั้ง (Vercel)

- `CRON_SECRET` — Vercel แนบใน header `Authorization: Bearer <CRON_SECRET>` ให้อัตโนมัติเมื่อ env นี้ถูกตั้ง · route reject 401 ถ้าไม่ตรง

## หมายเหตุ

- Vercel Hobby = cron ความถี่ ≤ วันละครั้ง · schedule รายเดือนนี้ผ่าน
- เดือนคำนวณด้วย `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" })` — กัน cron UTC ตัดเดือนคลาด
- manual import ใน `/recurring` ยังใช้ได้ปกติ = catch-up ถ้า cron พลาด หรือเพิ่ม template กลางเดือน

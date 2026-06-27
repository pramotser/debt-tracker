# Plan — Auto-generate รายการประจำ (Vercel Cron)

> สถานะ: ✅ โค้ดเสร็จ + push แล้ว (branch `claude/google-login-only-signup-isgz2o`) · ⏳ รอ setup ฝั่ง Vercel + merge ขึ้น production

## เป้าหมาย

สร้าง ledger ของ "รายการประจำ" (recurring template ที่ active) ให้อัตโนมัติทุกต้นเดือน
— ไม่ต้องเข้า `/recurring` แล้วกด "ดึงเข้าเดือนนี้" เองอีกต่อไป

---

## สิ่งที่ทำไปแล้ว (โค้ด)

| ไฟล์ | หน้าที่ |
|---|---|
| `src/server/recurring/generate.ts` | helper กลาง — `isTemplateDueInMonth` · `insertRecurringEntries` (dedupe+insert) · `generateRecurringForMonth` |
| `src/server/actions/recurring-ledger.ts` | refactor `importRecurringToMonth` → เรียก `insertRecurringEntries` ตัวเดียวกับ auto-gen |
| `src/app/api/cron/recurring/route.ts` | route ที่ cron ยิง · ตรวจ `CRON_SECRET` · คำนวณเดือนตามเวลาไทย · loop ทุก user |
| `vercel.json` | ลงทะเบียน cron `"5 0 1 * *"` |
| `docs/specs/recurring/auto-generate.md` | spec รายละเอียด |

**คุณสมบัติสำคัญ**
- **Idempotent** — dedupe ด้วย `(sourceType='recurring_template', sourceId, year, month)` → รันซ้ำกี่รอบก็ไม่สร้างซ้ำ
- **เคารพ template** — `active=false` ข้าม · `yearly` ลงเฉพาะเดือนตรง `renewDate` · `monthly` ทุกเดือน
- **logic ร่วมกับ manual import** — import เดิมในหน้า `/recurring` ยังใช้ได้ เป็น catch-up ถ้า cron พลาด/เพิ่ม template กลางเดือน

---

## ✅ Checklist สิ่งที่ "คุณ" ต้องทำ

### [ ] 1. ตั้ง env `CRON_SECRET` บน Vercel  ← สำคัญสุด
- สุ่มค่าลับ เช่น: `openssl rand -hex 32`
- Vercel → โปรเจกต์ → **Settings → Environment Variables**
- เพิ่ม key `CRON_SECRET` = ค่าที่สุ่ม · scope = **Production** (เพิ่ม Preview ถ้าจะเทสต์ก่อน)
- ⚠️ ถ้าไม่ตั้ง → route ตอบ `401` cron จะไม่สร้างอะไรเลย
- Vercel จะแนบ header `Authorization: Bearer <CRON_SECRET>` ให้ cron อัตโนมัติเมื่อ env นี้ถูกตั้ง

### [ ] 2. เอาโค้ดขึ้น production
- ตอนนี้โค้ดอยู่บน branch `claude/google-login-only-signup-isgz2o`
- merge ตาม git flow: feature → `develop` → `main`
- Vercel จะอ่าน `vercel.json` แล้วลงทะเบียน cron ตอน deploy production เท่านั้น
- (จะให้ผมเปิด PR ให้ก็ได้ — แค่บอก)

### [ ] 3. ยืนยันว่า cron ติดแล้ว
- หลัง deploy: Vercel → โปรเจกต์ → **Settings → Cron Jobs**
- ต้องเห็น `/api/cron/recurring` ตารางรายเดือน

---

## เทสต์เอง (ไม่ต้องรอวันที่ 1)

หลังตั้ง `CRON_SECRET` + deploy แล้ว ยิง endpoint ตรง ๆ:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://<your-domain>/api/cron/recurring
```

ผลลัพธ์ตัวอย่าง:
```json
{ "ok": true, "year": 2026, "month": 6, "users": 1, "created": 3 }
```
- `created` = จำนวน ledger ที่เพิ่ง insert · ยิงซ้ำรอบสองควรได้ `created: 0` (idempotent)

---

## กำหนดเวลา cron

- schedule `"5 0 1 * *"` = **00:05 UTC วันที่ 1** = **07:05 ตามเวลาไทย วันที่ 1**
- เดือนคำนวณด้วย timezone `Asia/Bangkok` ใน route → ไม่ตัดเดือนคลาด
- Vercel Hobby plan: cron ความถี่ ≤ วันละครั้ง → รายเดือนนี้ผ่านสบาย

---

## หมายเหตุ / เผื่อทำต่อ

- ตอนนี้ auto-gen ใช้ flag `active` ของแต่ละ template เป็นตัวคุม — ยังไม่มี global toggle เปิด/ปิดทั้งระบบ (เพิ่มทีหลังได้ที่ `/settings`)
- ต่อยอดได้: หลัง cron สร้าง ledger → ส่งแจ้งเตือน (อีเมล/ in-app banner) ว่า "รายการประจำเดือนนี้พร้อมแล้ว / มีบิลใกล้ครบกำหนด"

# Email Templates — Supabase Auth

HTML templates สำหรับอีเมลที่ Supabase Auth ส่งให้ user · โทนตรงกับแอป (โลโก้ 3 ขีด `BrandMark` + ปุ่มสีเข้มแบบหน้า landing)

## ไฟล์
- `confirm-signup.html` — ยืนยันอีเมลตอนสมัคร (Confirm signup)
- `reset-password.html` — ตั้งรหัสผ่านใหม่ (Reset password / Recovery)

## วิธีใช้
1. Supabase Dashboard → **Authentication → Email Templates**
2. เลือก template (*Confirm signup* / *Reset password*) → วาง HTML ทั้งไฟล์ในช่อง message body
3. Subject แนะนำ:
   - Confirm signup → `ยืนยันอีเมลของคุณ · Debt Tracker`
   - Reset password → `ตั้งรหัสผ่านใหม่ · Debt Tracker`

## หมายเหตุ
- ลิงก์ใช้ตัวแปร `{{ .ConfirmationURL }}` — Supabase แทนค่าให้อัตโนมัติ
- โลโก้รีสร้างด้วย table/div (ไม่พึ่งรูปภายนอก) เพราะ Gmail strip `<svg>` · ถ้าจะใช้รูปจริงต้อง host PNG บน URL สาธารณะก่อน
- ข้อความอายุลิงก์ (24 ชม. / 1 ชม.) อิงค่า default Supabase — ถ้าเปลี่ยน expiry/OTP ต้องแก้ตัวเลขในข้อความเอง
- HTML เขียนแบบ email-safe: table-based + inline style เผื่อ Outlook/Gmail
- ⚠️ Template ผูกกับ Supabase project — ถ้าแยก env prod/dev ต้องวางซ้ำในแต่ละ project

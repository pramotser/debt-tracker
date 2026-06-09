# Email template — Reset Password

Template สำหรับอีเมล "ลืมรหัสผ่าน" — ใช้ paste เข้า **Supabase Dashboard → Authentication → Email Templates → Reset Password**

## ค่าที่ตั้งคู่กัน
- **Subject**: `รีเซ็ตรหัสผ่าน Debt Tracker`
- **Email OTP Expiration**: `3600` วินาที (1 ชั่วโมง) — ตรงกับข้อความ "ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง" ในเทมเพลต
- **Redirect URL whitelist**: ต้องมี `<origin>/auth/callback` ใน Authentication → URL Configuration

## ตัวแปร Supabase
- `{{ .ConfirmationURL }}` — Supabase แทนด้วยลิงก์ recovery (callback + token)

## HTML

```html
<div style="background:#f0f2f5;padding:32px;font-family:sans-serif">
  <div style="background:#ffffff;border-radius:16px;max-width:480px;margin:0 auto;overflow:hidden">
    <div style="padding:32px 32px 24px;text-align:center">
      <div style="width:64px;height:64px;background:#1e2d4a;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <span style="color:white;font-size:28px">💼</span>
      </div>
      <p style="font-size:20px;font-weight:700;color:#1e2d4a;margin:0 0 4px">Debt Tracker</p>
      <p style="font-size:13px;color:#6b7280;margin:0">ติดตามหนี้/รายจ่ายส่วนตัว</p>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0">
    <div style="padding:28px 32px">
      <p style="font-size:16px;font-weight:600;color:#1e2d4a;text-align:center;margin:0 0 6px">รีเซ็ตรหัสผ่านของคุณ</p>
      <p style="font-size:13px;color:#6b7280;text-align:center;margin:0 0 24px;line-height:1.6">เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ<br>กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่</p>
      <a href="{{ .ConfirmationURL }}" style="display:block;background:#1e2d4a;color:white;text-decoration:none;text-align:center;padding:13px 24px;border-radius:10px;font-size:14px;font-weight:600;margin:0 0 24px">ตั้งรหัสผ่านใหม่</a>
      <p style="font-size:12px;color:#9ca3af;text-align:center;line-height:1.7;margin:0">ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง<br>หากคุณไม่ได้ทำรายการนี้ สามารถละเว้นอีเมลฉบับนี้ได้เลย</p>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center">
      <p style="font-size:11px;color:#9ca3af;margin:0">© 2026 Debt Tracker · ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
    </div>
  </div>
</div>
```

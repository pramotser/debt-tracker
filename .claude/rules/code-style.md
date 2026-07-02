# Code Style / Conventions

- เงิน = `numeric(12,2)`; แสดงผลผ่าน `lib/format.ts` เสมอ (ห้าม hardcode สัญลักษณ์เงิน)
- เดือน = เก็บ `year` + `month` (1-12); แสดง `YYYY/MM`; เทียบด้วย `year*100+month`; UI ตัวเปลี่ยนเดือน `[<] YYYY/MM [>]` ใช้ shared `components/layout/month-nav.tsx` (รองรับ `month=null` → year-only) ห้าม inline chevron + label เอง
- query ข้อมูลราย user ต้องกรอง `userId` ผ่าน `lib/auth.ts` → `getCurrentUser()` (Supabase Auth · throw ถ้าไม่ login)
- **Read** = Server Component เรียก `server/queries` โดยตรง
- **Mutation** = Server Action (`server/actions`) + `revalidatePath` + validate ด้วย zod ทุกครั้ง
- UI: shadcn เท่านั้น โทนมน ขอบโค้ง การ์ดนุ่ม
- Responsive: mobile-first ทุกหน้า · default stack 1 col → `sm:` (≥640px) ขยายเป็นหลาย col / row · เทสต์ที่ ~375px ก่อน commit · ห้ามเลข/ยอดเงิน wrap แตกบรรทัด · ห้ามพึ่ง `flex-wrap` เป็น mobile layout — ใช้ `flex-col sm:flex-row` ชัดเจน
- Role: `admin` = Banks/Categories/Users (ไม่มี userId) · `user` = Cards + ตาราง transactional (มี userId)

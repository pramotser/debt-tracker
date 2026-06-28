-- Migration: เพิ่ม onboarded_at ใน user_settings
-- เหตุผล: ผูกสถานะ onboarding (welcome modal + spotlight tour) กับ "บัญชีผู้ใช้"
--          แทน localStorage ราย browser — ให้คนสมัครใหม่เห็นทัวร์ครั้งเดียวต่อบัญชี (ข้ามทุกเครื่อง)
-- NULL = ผู้ใช้ใหม่ ยังไม่เคยผ่าน onboarding · มีค่า = ผ่านแล้ว ไม่ต้องเด้งอีก
-- nullable + ไม่มี default → ปลอดภัยกับ row เดิม (กลายเป็น NULL = treat ว่ายังไม่ผ่าน เด้งทัวร์รอบหน้า)

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

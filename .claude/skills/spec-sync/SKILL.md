---
name: spec-sync
description: Sync docs/specs/<module>/*.md with the actual code after finishing a feature or bugfix. Use when code under src/app/(portal)/<module>/, src/features/<domain>/, server/actions/*.ts, or server/queries/*.ts just changed and the matching spec doc needs to catch up — or when explicitly asked to "sync spec" / "อัปเดต spec ให้ตรง code". Do not use mid-feature on unfinished code; spec should reflect final behavior.
---

# spec-sync

ทำให้ `docs/specs/<module>/*.md` ตรงกับโค้ดจริง หลังจบ feature/bugfix — **ทิศทางเดียว: code → spec** (ไม่ใช่เครื่องมือ planning, ไม่เขียนโค้ดจาก spec)

## ขั้นตอน

1. **หา module ที่แก้** — ดู path ที่เพิ่งเปลี่ยน (`git diff --stat` / `git status`) แล้ว map เข้า spec ผ่านตาราง **"Map spec → code"** ใน `docs/README.md` (อ่านสดทุกครั้ง อย่าจำ path เก่า)
2. **อ่าน spec เดิมทั้งชุดของ module นั้น** — overview file + ทุก tab file ใน `docs/specs/<module>/`
3. **อ่านโค้ดจริงที่เกี่ยวข้อง** — `page.tsx`, `features/<domain>/*`, `server/actions/*.ts`, `server/queries/*.ts` ที่ map กับ module นั้น พอให้ตรวจแต่ละ section ของ spec ได้จริง (อย่าเดาจากชื่อไฟล์)
4. **ไล่เทียบทีละ section** เทียบกับโครงสร้าง spec ที่ `docs/README.md` กำหนดไว้ (Data model / Layout·Tabs / Logic / UI rules / Open questions) หาความต่าง เช่น
   - action/query ใหม่-ลบ-เปลี่ยนชื่อ ที่ spec ยังไม่มี
   - field ใน schema เปลี่ยน (เทียบกับ `.claude/rules/db-schema.md`)
   - UI state/dialog/flow ใหม่ที่ยังไม่ได้บันทึก
   - "Open questions" ข้อไหนถูกตอบแล้วในโค้ด (ย้ายออกหรือสรุปผล) / มีคำถามใหม่โผล่ขึ้นจากการตัดสินใจที่โค้ดทำแต่ spec ไม่ได้พูดถึง
5. **แยกความต่างเป็น 2 แบบ ก่อนแก้:**
   - **Additive/descriptive** (โค้ดเพิ่ม/ปรับรายละเอียดตามเจตนาเดิม) → แก้ spec ให้ตรงได้เลย
   - **Conflict กับเจตนาเดิมของ spec** (behavior เปลี่ยนไปจากที่ spec เคยบอกไว้ ไม่ใช่แค่รายละเอียดเพิ่ม) → **ห้ามเงียบแล้วทับ spec** ต้องแจ้งเจ้าของก่อน ตามกฎใน `docs/README.md`: *"code = ความจริง, spec = เจตนาเดิม → ถามเจ้าของก่อนแก้ฝั่งใดฝั่งหนึ่ง"*
6. **เขียน spec ตาม convention เดิม** (`docs/README.md` § "Convention ของ spec"):
   - ภาษาไทย
   - อ้างอิง schema ให้ตรง `.claude/rules/db-schema.md` / `src/db/schema/`
   - หัวไฟล์ระบุ route เสมอ
   - คงโครงสร้าง section เดิมของไฟล์นั้น (แต่ละ module อาจมี section ไม่เหมือนกันทุกอัน — ดูไฟล์เดิมเป็น template)
   - เงิน/เดือนตาม `.claude/rules/code-style.md` (`formatMoney`, `formatYearMonth`)
7. **module ใหม่ที่ยังไม่มี spec เลย** — เสนอสร้างไฟล์ใหม่โดยใช้ module ที่ใกล้เคียงที่สุดเป็น template (หน้าเดียวไม่มี tab → ใช้โครง `settings.md`, หน้ามีหลาย tab → ใช้โครง `recurring/recurring.md` + tab files แยก) แล้วอัปเดตตาราง **"Map spec → code"** และบรรทัด "ยังไม่มี spec" ใน `docs/README.md` ด้วย
8. **ห้ามแตะ** `docs/specs/_archive/` หรือโฟลเดอร์ deprecated (`monthly-cost/`, `subscription/`) — เก็บไว้เป็น history เท่านั้น
9. สรุปให้เจ้าของเห็นว่าแก้ spec ไฟล์ไหนบ้าง เพราะอะไร (โดยเฉพาะจุดที่เป็น conflict ตามข้อ 5) — **ไม่ commit เอง** ให้เป็นไปตาม flow ปกติของ session (commit เมื่อเจ้าของสั่ง)

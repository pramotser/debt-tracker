---
name: plan
description: Persist an approved Plan Mode plan to plan/<slug>.md as a checklist, and resume from it later. Use right after ExitPlanMode is approved for a non-trivial task, so the plan survives context compaction or a brand-new session/container. Also use before starting any task that might already have a plan/*.md — check there first and resume from the checked-off state instead of re-planning from scratch.
---

# plan

Plan Mode คิดแผนได้ดีอยู่แล้ว แต่ plan ที่ approve แล้วอยู่แค่ใน context การคุย — ถ้า context ถูก compact หรือเปิด session ใหม่/container ใหม่ plan จะหายไป skill นี้ทำให้ plan รอดข้ามตรงนั้นได้

## หลัง Plan Mode approve แล้ว (ก่อนเริ่มลงมือ)

1. ตั้งชื่อไฟล์ `plan/<slug>.md` — slug = อังกฤษสั้น ๆ kebab-case จากชื่องาน (เช่น `plan/add-recurring-yearly-reminder.md`)
2. หัวไฟล์ใส่: สรุปงาน 1-2 บรรทัด · branch ที่ทำ (ถ้ามี) · วันที่เริ่ม
3. แปลง plan ที่ approve แล้วเป็น checklist `- [ ] ...` ทีละ step — แต่ละ step ต้องระบุไฟล์/พื้นที่ที่จะแตะให้ชัด ให้กลับมาอ่านตอน context หายแล้วรู้ต่อได้ทันทีโดยไม่ต้องเดา

## ระหว่างลงมือทำ

- ทำ step ไหนเสร็จ → ติ๊ก `- [x]` **ทันที** อย่ารอทำครบทุก step ค่อยติ๊กรวด (เพราะถ้า context หายกลางทาง จะไม่รู้ว่าทำถึงไหนแล้วจริง ๆ)
- ถ้าเจอปัญหาที่ทำให้แผนเปลี่ยนจากที่ตกลงไว้ → แก้ไฟล์ `plan/<slug>.md` ให้ตรงสภาพจริงด้วย ห้ามปล่อยให้ plan เก่ากับสิ่งที่ทำจริงเพี้ยนกัน

## ก่อนเริ่มงานใหม่ (resume check)

- เช็ค `plan/` ก่อนเสมอว่ามีไฟล์ที่ตรงกับงานที่กำลังจะทำไหม
- ถ้ามี → อ่านทั้งไฟล์ก่อน ดู checklist ว่าติ๊กไปถึงไหน แล้วถามเจ้าของยืนยันว่าจะทำต่อจากจุดนั้นเลย หรือแผนเปลี่ยนไปแล้วอยากวางใหม่ — **ห้ามเดาเองว่าทำต่อได้จากจุดที่ติ๊กไว้โดยไม่ verify** เพราะโค้ดจริงอาจเปลี่ยนไปจากที่ plan บันทึกไว้ (ให้ตรวจ git log/diff เทียบกับ checklist ก่อน)

## งานเสร็จสมบูรณ์ทั้งแผน

- ทุก step ติ๊กครบ → แก้หัวไฟล์เป็น "✅ เสร็จแล้ว"
- ไม่ต้องลบไฟล์ทิ้งเอง (เก็บเป็น history) ปล่อยให้เจ้าของลบเองถ้าต้องการ

## Git

- `plan/` ถูก track ใน git แล้ว (ไม่ gitignore) — commit ตาม flow ปกติของ `.claude/rules/git-workflow.md` (commit ได้เมื่อ dev+tsc ผ่าน แต่ **ไม่ push เอง** จนกว่าเจ้าของยืนยัน เหมือนโค้ดทุกอย่าง)

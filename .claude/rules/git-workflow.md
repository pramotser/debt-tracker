# Git Workflow

1. Git flow: `main` = production · `develop` = integration · feature branches `chore/feat/fix/perf/docs-<x>` แตกจาก `develop` แล้ว merge กลับ `develop` · `develop` → `main` ทำเมื่อเจ้าของยืนยัน — **ห้ามแตะ `main` ตรง ๆ**
2. เขียนเสร็จ → `npm run dev` ให้ขึ้น + `tsc` ผ่าน → commit ได้เลย (Conventional Commits) → สรุปสิ่งที่ทำ
3. **ห้าม push / เปิด PR เอง** จนกว่าเจ้าของยืนยัน
4. ตรวจก่อน commit: ไม่มี `.env*`/secret หลุด

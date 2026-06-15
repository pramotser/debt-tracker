import Link from "next/link";

import { BrandMark } from "./brand-mark";

export function LandingFinalCta() {
  return (
    <>
      <section className="pb-3">
        <div className="mx-auto max-w-[1140px] px-6">
          <div className="mx-auto max-w-[640px] py-4 text-center">
            <h2 className="mx-auto mb-2.5 max-w-[22ch] text-[clamp(25px,3.1vw,34px)] font-bold leading-[1.22] tracking-[-0.01em]">
              อยากลองคุมเงินแบบเห็นภาพไหม
            </h2>
            <p className="mb-6 text-[16.5px] text-[#4B5B73]">
              สมัครแล้วลองดึงค่าใช้จ่ายเดือนนี้เข้ามาดูได้เลย
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center rounded-2xl bg-foreground px-6 py-3.5 text-[16px] font-medium text-background shadow-[0_8px_20px_-10px_rgba(15,23,42,0.55)] transition-transform hover:-translate-y-px hover:shadow-[0_12px_26px_-10px_rgba(15,23,42,0.6)]"
              >
                เข้าไปลองดู
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-2xl px-6 py-3.5 text-[16px] font-medium transition-colors hover:bg-foreground/5"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-14 border-t border-foreground/10 py-10">
        <div className="mx-auto flex max-w-[1140px] flex-wrap items-center justify-between gap-4 px-6 text-[14px] text-[#8A99AD]">
          <Link href="/" className="flex items-center gap-2.5 text-[15px] text-foreground">
            <BrandMark />
            <span className="font-semibold">Debt Tracker</span>
          </Link>
          <div>โปรเจกต์ส่วนตัว · เปิดให้เพื่อนลอง</div>
          <div>© 2026</div>
        </div>
      </footer>
    </>
  );
}

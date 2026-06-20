import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";

import { RevealOnScroll } from "./reveal-on-scroll";

export function LandingFinalCta() {
  return (
    <>
      <section className="pb-3">
        <div className="mx-auto max-w-[1140px] px-6">
          <RevealOnScroll className="mx-auto max-w-[640px] py-4 text-center">
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
          </RevealOnScroll>
        </div>
      </section>

  <footer className="mt-14 border-t border-foreground/10">
    <div className="mx-auto max-w-[1140px] px-6 py-12">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        {/* Brand + description */}
        <div className="max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-[15px] text-foreground transition-opacity hover:opacity-80"
          >
            <BrandMark />
            <span className="font-semibold">Debt Tracker</span>
          </Link>
          <p className="mt-3 text-[14px] leading-relaxed text-[#8A99AD]">
            Debt Tracker เป็นแอปฟรีที่ผมทำไว้ใช้เอง
            เพื่อคุมรายจ่ายและหนี้ของตัวเองครับ
          </p>
        </div>

        {/* Copyright */}
        <div className="text-[13px] text-[#8A99AD] md:text-right">
          <p>Everything Group</p>
          <p className="mt-1 text-[#8A99AD]/70">&copy; 2026 สงวนลิขสิทธิ์</p>
        </div>
      </div>
    </div>
  </footer>
    </>
  );
}

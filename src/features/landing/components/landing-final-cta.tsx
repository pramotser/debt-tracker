import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";

import { RevealOnScroll } from "./reveal-on-scroll";

export function LandingFinalCta() {
  return (
    <>
      <section className="pb-4">
        <div className="mx-auto max-w-[1140px] px-6">
          <RevealOnScroll className="relative mx-auto max-w-[760px] overflow-hidden rounded-[30px] border border-[#2E9E6B]/20 bg-gradient-to-b from-[#E4F3EC]/60 to-background px-6 py-12 text-center sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute left-1/2 top-0 size-[300px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,rgba(46,158,107,0.22),transparent_66%)]" />
            <div className="relative">
              <span className="mb-5 inline-grid place-items-center">
                <BrandMark size={42} />
              </span>
              <h2 className="mx-auto mb-3 max-w-[24ch] text-[clamp(26px,3.4vw,36px)] font-bold leading-[1.18] tracking-[-0.02em]">
                อยากลองคุมเงินแบบเห็นภาพไหม
              </h2>
              <p className="mx-auto mb-7 max-w-[44ch] text-[16.5px] leading-relaxed text-[#4B5B73]">
                เข้าสู่ระบบด้วย Google แล้วลองดึงค่าใช้จ่ายเดือนนี้เข้ามาดูได้เลย
                ไม่ต้องตั้งค่าอะไรเยอะ
              </p>
              <Link
                href="/login"
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-foreground px-7 py-3.5 text-[16px] font-medium text-background shadow-[0_16px_34px_-12px_rgba(15,23,42,0.7)] transition-transform hover:-translate-y-0.5"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.596-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22Z"
                    fill="#34A853"
                  />
                  <path
                    d="M6.404 13.9A5.99 5.99 0 0 1 6.09 12c0-.66.114-1.3.314-1.9V7.51H3.064A9.996 9.996 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.34-2.59Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.96 2.99 14.696 2 12 2A9.996 9.996 0 0 0 3.064 7.51l3.34 2.59C7.19 7.736 9.395 5.977 12 5.977Z"
                    fill="#EA4335"
                  />
                </svg>
                เข้าสู่ระบบด้วย Google
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

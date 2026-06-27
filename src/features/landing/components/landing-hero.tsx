import Link from "next/link";

import { LandingPhoneMockup } from "./landing-phone-mockup";

const TRUST_STATS = [
  { value: "4 มุม", label: "รายจ่าย · บัตร · ผ่อน · ภาพรวม" },
  { value: "ฟรี", label: "ไม่มีค่าใช้จ่าย ใช้ได้เลย" },
  { value: "Google", label: "ล็อกอินครั้งเดียว เริ่มจดได้" },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pb-10 pt-8 sm:pb-16 sm:pt-16">
      {/* decorative gradient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-12%] size-[460px] rounded-full bg-[radial-gradient(circle,rgba(46,158,107,0.18),transparent_64%)] blur-[6px]" />
        <div className="absolute right-[-8%] top-[6%] size-[420px] rounded-full bg-[radial-gradient(circle,rgba(20,40,90,0.12),transparent_66%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-[1140px] grid-cols-1 items-center gap-12 px-6 sm:grid-cols-[1.04fr_0.96fr] sm:gap-[56px]">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#2E9E6B]/25 bg-[#E4F3EC]/70 px-3.5 py-1.5 text-[13px] font-medium text-[#218355] backdrop-blur-sm">
            <span className="relative flex size-[7px]">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2E9E6B] opacity-60" />
              <span className="relative inline-flex size-[7px] rounded-full bg-[#2E9E6B]" />
            </span>
            แอปไว้ใช้เอง · เปิดให้เพื่อนลอง
          </span>

          <h1 className="mb-5 text-[clamp(34px,4.8vw,54px)] font-bold leading-[1.1] tracking-[-0.02em]">
            รายจ่าย ผ่อนบัตร
            <br />
            <span className="relative inline-block bg-gradient-to-r from-[#2E9E6B] to-[#33B377] bg-clip-text text-transparent">
              รู้หมด
            </span>{" "}
            ในที่เดียว
          </h1>

          <p className="mb-8 max-w-[42ch] text-[17.5px] leading-relaxed text-[#4B5B73]">
            ผมทำแอปนี้ไว้คุมรายจ่ายตัวเอง — ค่าใช้จ่ายประจำ ยอดผ่อน บิลบัตรเครดิต
            รวมไว้ที่เดียว เห็นภาพว่าเงินไหลไปไหน เหลือต้องจ่ายอีกเท่าไหร่
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-[16px] font-medium text-background shadow-[0_14px_30px_-12px_rgba(15,23,42,0.65)] transition-transform hover:-translate-y-0.5"
            >
              เข้าไปลองดูเลย
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </svg>
            </Link>
            <Link
              href="#zones"
              className="inline-flex items-center justify-center rounded-2xl border border-foreground/15 bg-background/60 px-6 py-3.5 text-[16px] font-medium transition-colors hover:bg-foreground/5"
            >
              มีอะไรในแอปบ้าง
            </Link>
          </div>

          {/* trust stats */}
          <dl className="mt-9 grid max-w-[440px] grid-cols-3 gap-4 border-t border-foreground/10 pt-6">
            {TRUST_STATS.map((s) => (
              <div key={s.value}>
                <dt className="text-[18px] font-bold tracking-[-0.01em] text-[#16243F]">
                  {s.value}
                </dt>
                <dd className="mt-1 text-[12px] leading-snug text-[#8A99AD]">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative flex justify-center">
          {/* floating teaser cards — desktop only */}
          <div className="pointer-events-none absolute -left-2 top-10 z-20 hidden animate-[float_6s_ease-in-out_infinite] rounded-2xl border border-foreground/10 bg-card/90 px-4 py-3 shadow-[0_18px_40px_-18px_rgba(22,36,63,0.35)] backdrop-blur-sm lg:block">
            <div className="text-[11px] text-[#8A99AD]">ค้างจ่ายเดือนนี้</div>
            <div className="font-mono text-[18px] font-bold text-[#DD7A2E]">
              ฿9,279
            </div>
          </div>

          <div className="pointer-events-none absolute -right-3 bottom-16 z-20 hidden animate-[float_7s_ease-in-out_infinite_0.8s] rounded-2xl border border-foreground/10 bg-card/90 px-4 py-3 shadow-[0_18px_40px_-18px_rgba(22,36,63,0.35)] backdrop-blur-sm lg:block">
            <div className="mb-1 text-[11px] text-[#8A99AD]">ผ่อน iPad Air</div>
            <div className="flex items-center gap-2">
              <div className="h-[6px] w-[64px] overflow-hidden rounded-full bg-[#E4EAE7]">
                <span className="block h-full w-1/5 rounded-full bg-[#2E9E6B]" />
              </div>
              <span className="font-mono text-[11px] font-semibold text-[#16243F]">
                2/10
              </span>
            </div>
          </div>

          <LandingPhoneMockup />
        </div>
      </div>
    </section>
  );
}

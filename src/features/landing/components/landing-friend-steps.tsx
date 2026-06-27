import { FRIEND_STEPS } from "../constants";

import { RevealOnScroll } from "./reveal-on-scroll";

export function LandingFriendSteps() {
  return (
    <section className="pb-14 sm:pb-[78px]">
      <div className="mx-auto max-w-[1140px] px-6">
        <RevealOnScroll className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#16243F] via-[#101a30] to-[#0d1421] px-6 py-12 text-background sm:px-12 sm:py-[58px]">
          {/* glows */}
          <div className="pointer-events-none absolute -right-24 -top-24 size-[340px] rounded-full bg-[radial-gradient(circle,rgba(46,158,107,0.32),transparent_64%)]" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 size-[300px] rounded-full bg-[radial-gradient(circle,rgba(46,158,107,0.14),transparent_66%)]" />

          <div className="relative">
            <div className="mb-2.5 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-[#7FE0C0]">
              <span className="size-[6px] rounded-full bg-[#7FE0C0]" />
              ได้ลิงก์มาแล้ว เริ่มยังไง
            </div>
            <h2 className="text-[clamp(22px,3.4vw,36px)] font-bold leading-[1.18] tracking-[-0.02em]">
              ล็อกอินครั้งเดียว แล้วเริ่มจดได้เลย
            </h2>
            <p className="mt-3 max-w-[48ch] text-[16px] leading-relaxed text-[#B9C4D4]">
              แอปนี้ทำไว้ใช้ส่วนตัว เลยเปิดให้เพื่อนที่สนใจลองด้วย
              ข้อมูลของแต่ละคนแยกกัน ใครเห็นแต่ของตัวเอง
            </p>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-7">
              {FRIEND_STEPS.map((step) => (
                <div
                  key={step.no}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-colors hover:border-[#7FE0C0]/30 hover:bg-white/[0.06]"
                >
                  <div className="mb-3.5 grid size-9 place-items-center rounded-xl bg-[#7FE0C0]/12 font-mono text-[14px] font-semibold text-[#7FE0C0]">
                    {step.no}
                  </div>
                  <h4 className="mb-1.5 text-[17px] font-semibold">
                    {step.title}
                  </h4>
                  <p className="text-[14.5px] leading-relaxed text-[#B9C4D4]">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

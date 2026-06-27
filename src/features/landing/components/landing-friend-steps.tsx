import { FRIEND_STEPS } from "../constants";

import { RevealOnScroll } from "./reveal-on-scroll";

export function LandingFriendSteps() {
  return (
    <section className="pb-14 sm:pb-[70px]">
      <div className="mx-auto max-w-[1140px] px-6">
        <RevealOnScroll className="relative overflow-hidden rounded-[28px] bg-foreground px-6 py-12 text-background sm:px-12 sm:py-[50px]">
          <div className="pointer-events-none absolute -right-24 -top-24 size-[320px] rounded-full bg-[radial-gradient(circle,rgba(46,158,107,0.3),transparent_65%)]" />
          <div className="relative">
            <div className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#7FE0C0]">
              ได้ลิงก์มาแล้ว เริ่มยังไง
            </div>
            <h2 className="max-w-[24ch] text-[clamp(25px,3.1vw,34px)] font-bold leading-[1.22] tracking-[-0.01em]">
              ล็อกอินครั้งเดียว{" "}
              <span className="whitespace-nowrap">แล้วเริ่มจดได้เลย</span>
            </h2>
            <p className="mt-3 max-w-[46ch] text-[16px] text-[#B9C4D4]">
              แอปนี้ทำไว้ใช้ส่วนตัว เลยเปิดให้เพื่อนที่สนใจลองด้วย ข้อมูลของแต่ละคนแยกกัน
              ใครเห็นแต่ของตัวเอง
            </p>

            <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-7">
              {FRIEND_STEPS.map((step) => (
                <div key={step.no}>
                  <div className="mb-3 flex items-center gap-2.5 font-mono text-[13px] font-semibold text-[#7FE0C0]">
                    {step.no}
                    <span className="h-px flex-1 bg-white/15" />
                  </div>
                  <h4 className="mb-1.5 text-[17px] font-semibold">{step.title}</h4>
                  <p className="text-[14.5px] text-[#B9C4D4]">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

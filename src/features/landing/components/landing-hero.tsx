import Link from "next/link";

import { LandingPhoneMockup } from "./landing-phone-mockup";

export function LandingHero() {
  return (
    <section className="pb-9 pt-10 sm:pb-9 sm:pt-[60px]">
      <div className="mx-auto grid max-w-[1140px] grid-cols-1 items-center gap-10 px-6 sm:grid-cols-[1.02fr_0.98fr] sm:gap-[52px]">
        <div>
          {/* <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#E4F3EC] px-3 py-1.5 text-[13px] font-medium text-[#2E9E6B]">
            <span className="size-[7px] rounded-full bg-[#2E9E6B]" />
            แอปไว้ใช้เอง · เปิดให้เพื่อนลอง
          </span> */}
          <h1 className="mb-4 text-[clamp(32px,4.4vw,50px)] font-bold leading-[1.14] tracking-[-0.01em]">
            รายจ่าย ผ่อนบัตรเครดิต
            <br />
            <span className="text-[#2E9E6B]">รู้หมด</span> ในที่เดียว
          </h1>
          <p className="mb-7 max-w-[40ch] text-[17.5px] text-[#4B5B73]">
            ผมทำแอปนี้ไว้คุมรายจ่ายตัวเอง — ค่าใช้จ่ายประจำ ยอดผ่อน บิลบัตรเครดิต
            รวมไว้ที่เดียว เห็นเป็นภาพโดยรวมรายจ่าย ว่าเงินไหลไปไหน
            เหลือต้องจ่ายอีกเท่าไหร่
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {/* ปิดสมัคร: ชี้ปุ่มหลักไป login Google แทน /register */}
            <Link
              href="/login"
              className="inline-flex items-center rounded-2xl bg-foreground px-6 py-3.5 text-[16px] font-medium text-background shadow-[0_8px_20px_-10px_rgba(15,23,42,0.55)] transition-transform hover:-translate-y-px hover:shadow-[0_12px_26px_-10px_rgba(15,23,42,0.6)]"
            >
              เข้าไปลองดู
            </Link>
            <Link
              href="#zones"
              className="inline-flex items-center rounded-2xl px-6 py-3.5 text-[16px] font-medium transition-colors hover:bg-foreground/5"
            >
              มีอะไรในแอปบ้าง
            </Link>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-[13.5px] text-[#8A99AD]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#2E9E6B"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            มีบัญชีแล้วก็{" "}
            <Link
              href="/login"
              className="font-medium text-[#2E9E6B] hover:underline"
            >
              เข้าสู่ระบบ
            </Link>{" "}
            ได้เลย
          </p>
        </div>

        <LandingPhoneMockup />
      </div>
    </section>
  );
}

import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";

const VALUE_PROPS = [
  "ค่าใช้จ่ายประจำ ค่าบ้าน ค่าน้ำค่าไฟ รวมไว้ที่เดียว",
  "ยอดผ่อน บิลบัตรเครดิต รู้ว่าเหลือต้องจ่ายอีกเท่าไหร่",
  "เห็นภาพรวมว่าเงินไหลไปไหน วางแผนล่วงหน้าได้",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* ── Brand panel (desktop เท่านั้น) ───────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#16243F] via-[#101a30] to-[#0d1421] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-[360px] rounded-full bg-[radial-gradient(circle,rgba(46,158,107,0.32),transparent_64%)]" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 size-[320px] rounded-full bg-[radial-gradient(circle,rgba(46,158,107,0.14),transparent_66%)]" />

        {/* logo */}
        <Link
          href="/"
          className="relative inline-flex items-center gap-2.5 text-[18px] font-semibold transition-opacity hover:opacity-90"
        >
          <BrandMark />
          <span>Debt Tracker</span>
        </Link>

        {/* headline + value props */}
        <div className="relative max-w-[30ch]">
          <h2 className="text-[clamp(26px,2.6vw,34px)] font-bold leading-[1.18] tracking-[-0.02em]">
            คุมรายจ่ายและหนี้
            <br />
            ให้เห็นภาพในที่เดียว
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#B9C4D4]">
            เข้าสู่ระบบเพื่อจัดการรายจ่ายประจำ ยอดผ่อน และบิลบัตรเครดิตของคุณ
          </p>

          <ul className="mt-8 flex flex-col gap-4">
            {VALUE_PROPS.map((text) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#7FE0C0]/15">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="#7FE0C0"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-[14.5px] leading-relaxed text-[#D7DEE9]">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[13px] text-[#7E8DA3]">
          &copy; 2026 Debt Tracker · Everything Group
        </p>
      </div>

      {/* ── Content (login/register/forgot/reset) ───────────────────── */}
      <div className="relative flex items-center justify-center overflow-hidden bg-background p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-8%] size-[380px] rounded-full bg-[radial-gradient(circle,rgba(46,158,107,0.14),transparent_66%)]" />
          <div className="absolute bottom-[-12%] right-[-8%] size-[340px] rounded-full bg-[radial-gradient(circle,rgba(20,40,90,0.10),transparent_68%)]" />
        </div>

        <div className="relative w-full max-w-[400px]">
          {/* back to home — มือถือชี้กลับ landing ได้ง่าย */}
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-1.5 text-[13.5px] text-[#8A99AD] transition-colors hover:text-foreground"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M11 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            กลับหน้าแรก
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}

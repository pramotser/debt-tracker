import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";

export function AuthBrand() {
  return (
    <div className="mb-7 flex flex-col items-center gap-2.5 text-center">
      <Link href="/" aria-label="กลับหน้าแรก">
        <BrandMark size={40} />
      </Link>
      <span className="text-[15px] font-semibold tracking-tight text-[#8A99AD]">
        Debt Tracker
      </span>
    </div>
  );
}

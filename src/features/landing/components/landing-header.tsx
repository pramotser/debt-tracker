"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:pt-4">
      <div
        className={cn(
          "mx-auto flex max-w-[1100px] items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 sm:px-5",
          scrolled
            ? "border border-foreground/10 bg-background/80 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl backdrop-saturate-150"
            : "border border-transparent"
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.01em]"
        >
          <BrandMark />
          <span>Debt Tracker</span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <Link
            href="#zones"
            className="hidden rounded-xl px-4 py-2 text-[14.5px] font-medium text-[#4B5B73] transition-colors hover:bg-foreground/5 hover:text-foreground sm:inline-flex"
          >
            มีอะไรในแอป
          </Link>
          <Link
            href="/login"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-[14.5px] font-medium text-background shadow-[0_10px_24px_-12px_rgba(15,23,42,0.7)] transition-transform hover:-translate-y-px"
          >
            เข้าสู่ระบบ
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
}

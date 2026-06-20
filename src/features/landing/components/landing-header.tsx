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
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-transparent backdrop-blur-md backdrop-saturate-150 transition-colors duration-200",
        scrolled
          ? "border-foreground/10 bg-background/95"
          : "bg-background/80"
      )}
    >
      <div className="mx-auto flex h-[66px] max-w-[1140px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 text-[18px] font-semibold">
          <BrandMark />
          <span>Debt Tracker</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex items-center rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors hover:bg-foreground/5"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center rounded-xl bg-foreground px-4 py-2.5 text-[15px] font-medium text-background shadow-[0_8px_20px_-10px_rgba(15,23,42,0.55)] transition-transform hover:-translate-y-px hover:shadow-[0_12px_26px_-10px_rgba(15,23,42,0.6)]"
          >
            สมัคร
          </Link>
        </nav>
      </div>
    </header>
  );
}

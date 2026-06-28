"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: LucideIcon };

const links: NavLink[] = [
  { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/recurring", label: "รายการประจำ", icon: ListChecks },
  { href: "/credit-cards", label: "บัตร", icon: CreditCard },
  { href: "/ledger", label: "ทั้งหมด", icon: ScrollText },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-stretch border-t border-border bg-background md:hidden"
      aria-label="เมนูหลัก"
    >
      {links.map((l) => {
        const active = isActivePath(pathname, l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            data-tour={`nav-${l.href.slice(1)}`}
            aria-label={l.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-7" aria-hidden />
          </Link>
        );
      })}
    </nav>
  );
}

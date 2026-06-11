"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/server/actions/auth";

type NavLink = { href: string; label: string; icon: LucideIcon };

const mainLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monthly-cost", label: "ค่าใช้จ่ายรายเดือน", icon: CalendarDays },
  { href: "/subscription", label: "สมาชิก/บริการ", icon: RefreshCw },
  { href: "/credit-cards", label: "บัตรเครดิต", icon: CreditCard },
];

const settingsLink: NavLink = {
  href: "/settings",
  label: "ตั้งค่า",
  icon: Settings,
};

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({ link, active }: { link: NavLink; active: boolean }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-secondary font-medium text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-sm bg-primary"
        />
      )}
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{link.label}</span>
    </Link>
  );
}

export function Sidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[240px] flex-col border-r border-border bg-background md:flex">
      <div className="flex flex-col gap-0.5 px-5 pt-5 pb-4">
        <span className="text-lg font-bold text-primary">Debt Tracker</span>
        <span className="text-xs text-muted-foreground">
          ติดตามหนี้/รายจ่าย
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="เมนูหลัก">
        {mainLinks.map((link) => (
          <NavItem
            key={link.href}
            link={link}
            active={isActivePath(pathname, link.href)}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-border px-3 py-3">
        <NavItem
          link={settingsLink}
          active={isActivePath(pathname, settingsLink.href)}
        />
        {displayName && (
          <div className="px-3 pt-2 text-xs text-muted-foreground" title={displayName}>
            <span className="block truncate">{displayName}</span>
          </div>
        )}
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          >
            <LogOut className="size-4 shrink-0" />
            <span className="truncate">ออกจากระบบ</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}

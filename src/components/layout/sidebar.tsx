"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ScrollText,
  Settings,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/server/actions/auth";

type NavLink = { href: string; label: string; icon: LucideIcon };

const mainLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recurring", label: "รายการค่าใช้จ่าย", icon: ListChecks },
  { href: "/credit-cards", label: "บัตรเครดิต", icon: CreditCard },
  { href: "/ledger", label: "รายการทั้งหมด", icon: ScrollText },
];

const adminLinks: NavLink[] = [
  { href: "/banks", label: "ธนาคาร", icon: Building2 },
  { href: "/categories", label: "หมวดหมู่", icon: Tag },
  { href: "/users", label: "ผู้ใช้", icon: Users },
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

export function Sidebar({
  displayName,
  role,
}: {
  displayName: string;
  role: "admin" | "user";
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[240px] flex-col border-r border-border bg-background md:flex">
      <div className="flex items-start justify-between gap-2 px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <BrandMark size={32} />
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-bold text-primary">Debt Tracker</span>
            <span className="text-xs text-muted-foreground">
              ติดตามหนี้/รายจ่าย
            </span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="เมนูหลัก">
        {mainLinks.map((link) => (
          <NavItem
            key={link.href}
            link={link}
            active={isActivePath(pathname, link.href)}
          />
        ))}
        {role === "admin" && (
          <div className="mt-4 flex flex-col gap-1">
            <span className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              ผู้ดูแลระบบ
            </span>
            {adminLinks.map((link) => (
              <NavItem
                key={link.href}
                link={link}
                active={isActivePath(pathname, link.href)}
              />
            ))}
          </div>
        )}
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Landmark,
  LayoutGrid,
  ListChecks,
  type LucideIcon,
  ReceiptText,
  Repeat,
  Settings,
  Tags,
  Users,
  Wallet,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavLink = { href: string; label: string; icon: LucideIcon };

const mainLinks: NavLink[] = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutGrid },
  { href: "/fix-cost", label: "ค่าใช้จ่ายรายเดือน", icon: ReceiptText },
  { href: "/subscription", label: "สมาชิก/บริการ", icon: Repeat },
  { href: "/installment", label: "ผ่อนชำระ", icon: Wallet },
  { href: "/cards", label: "บัตรเครดิต", icon: CreditCard },
  { href: "/ledger", label: "รายการทั้งหมด", icon: ListChecks },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
];

const adminLinks: NavLink[] = [
  { href: "/banks", label: "ธนาคาร", icon: Landmark },
  { href: "/categories", label: "หมวดหมู่", icon: Tags },
  { href: "/users", label: "ผู้ใช้", icon: Users },
];

// base-ui emits data-active="" when isActive, so use the bare data-active selector
// `!` (Tailwind v4 important suffix) ensures navy wins over hover:bg-sidebar-accent
const activeClasses =
  "data-active:bg-primary! data-active:text-primary-foreground! data-active:hover:bg-primary! data-active:hover:text-primary-foreground!";

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ links, pathname }: { links: NavLink[]; pathname: string }) {
  return (
    <SidebarMenu>
      {links.map((l) => {
        const active = isActivePath(pathname, l.href);
        return (
          <SidebarMenuItem key={l.href}>
            <SidebarMenuButton
              render={<Link href={l.href} />}
              isActive={active}
              tooltip={l.label}
              className={activeClasses}
            >
              <l.icon className="size-4 shrink-0" />
              <span>{l.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function PortalSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-4">
        <span className="text-lg font-bold text-primary group-data-[collapsible=icon]:hidden">
          Debt Tracker
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>เมนูหลัก</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavLinks links={mainLinks} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>จัดการระบบ</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavLinks links={adminLinks} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

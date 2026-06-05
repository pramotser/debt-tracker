import Link from "next/link";

const mainLinks = [
  { href: "/dashboard", label: "ภาพรวม" },
  { href: "/fix-cost", label: "ค่าใช้จ่ายประจำ" },
  { href: "/subscription", label: "สมาชิก/บริการ" },
  { href: "/installment", label: "ผ่อนชำระ" },
  { href: "/cards", label: "บัตรเครดิต" },
  { href: "/ledger", label: "รายการทั้งหมด" },
  { href: "/settings", label: "ตั้งค่า" },
];

const adminLinks = [
  { href: "/banks", label: "ธนาคาร" },
  { href: "/categories", label: "หมวดหมู่" },
  { href: "/users", label: "ผู้ใช้" },
];

function NavGroup({
  label,
  links,
}: {
  label: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1 text-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PortalNav() {
  return (
    <div className="flex flex-col gap-3">
      <NavGroup label="เมนูหลัก" links={mainLinks} />
      <NavGroup label="จัดการระบบ" links={adminLinks} />
    </div>
  );
}

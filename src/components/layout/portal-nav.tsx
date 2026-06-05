import Link from "next/link";

const links = [
  { href: "/", label: "แดชบอร์ด" },
  { href: "/cards", label: "บัตร" },
  { href: "/transactions", label: "ธุรกรรม" },
  { href: "/installments", label: "ผ่อนชำระ" },
  { href: "/banks", label: "ธนาคาร" },
  { href: "/categories", label: "หมวดหมู่" },
  { href: "/users", label: "ผู้ใช้" },
];

export function PortalNav() {
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

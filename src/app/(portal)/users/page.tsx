import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { formatFullName } from "@/lib/format";
import { listUsers } from "@/server/queries/users";

const TH_DATE = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (user.role !== "admin") notFound();

  const rows = await listUsers();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">ผู้ใช้</h1>
          <Badge variant="secondary">admin</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          อ่านอย่างเดียว · จัดการ role ผ่าน Supabase Dashboard
        </p>
      </header>

      <ul className="flex flex-col gap-2">
        {rows.map((u) => (
          <li
            key={u.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {formatFullName(u)}
              </span>
              <span className="text-xs text-muted-foreground">
                {u.id}
              </span>
            </div>
            <Badge variant={u.role === "admin" ? "default" : "secondary"}>
              {u.role}
            </Badge>
            <span className="text-xs text-muted-foreground tabular-nums">
              {TH_DATE.format(u.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

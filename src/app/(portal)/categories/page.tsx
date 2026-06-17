import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { CategoriesTable } from "@/features/admin/categories-table";
import { getCurrentUser } from "@/lib/auth";
import {
  getCategoryUsageCount,
  listCategoriesAdmin,
} from "@/server/queries/categories";

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (user.role !== "admin") notFound();

  const [items, usageMap] = await Promise.all([
    listCategoriesAdmin(),
    getCategoryUsageCount(),
  ]);
  const usage = Object.fromEntries(usageMap);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">หมวดหมู่</h1>
          <Badge variant="secondary">admin</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          ข้อมูลกลาง · ใช้แท็กรายการในทุก module
        </p>
      </header>

      <CategoriesTable initialCategories={items} usage={usage} />
    </div>
  );
}

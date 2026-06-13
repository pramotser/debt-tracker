import type { Category } from "@/db/schema";
import { getCategoryIcon } from "@/lib/categories";

// pill เล็กแสดงหมวด — icon บนพื้นสีตาม catalog + ชื่อ
// category=undefined → dash placeholder (ใช้ตอน id ไม่อยู่ใน catalog ฝั่ง caller)
type CategoryLike = Pick<Category, "name"> &
  Partial<Pick<Category, "icon" | "colorBg" | "colorFg">>;

export function CategoryBadge({ category }: { category?: CategoryLike }) {
  if (!category) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
        —
      </span>
    );
  }
  const Icon = getCategoryIcon(category.icon ?? null);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-0.5 text-xs">
      <span
        className="flex h-4 w-4 items-center justify-center rounded-sm"
        style={{
          backgroundColor: category.colorBg ?? "var(--muted)",
          color: category.colorFg ?? "var(--muted-foreground)",
        }}
      >
        <Icon className="size-2.5" aria-hidden />
      </span>
      <span className="truncate">{category.name}</span>
    </span>
  );
}

import { createElement } from "react";

import { getCategoryIcon } from "@/lib/categories";

// render ไอคอนหมวดจาก key — ใช้ createElement เพื่อไม่ประกาศ component ใหม่ระหว่าง render
export function CategoryIcon({
  icon,
  className,
}: {
  icon: string | null | undefined;
  className?: string;
}) {
  return createElement(getCategoryIcon(icon), { className });
}

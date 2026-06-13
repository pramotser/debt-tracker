"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

// sync ค่า theme จาก DB → localStorage (next-themes) หลัง mount
// case ที่สำคัญ: login บนอุปกรณ์ใหม่ → localStorage ยังว่าง → ดึงจาก DB
export function ThemeSync({ serverTheme }: { serverTheme: string }) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme !== serverTheme) {
      setTheme(serverTheme);
    }
    // ตั้งใจ run ครั้งเดียวตอน mount — sync DB → client เท่านั้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

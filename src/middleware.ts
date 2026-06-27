import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // ทุก route ยกเว้น static/api/_next + ไฟล์ static
    // (api = route handler จัดการ auth เอง เช่น cron ใช้ CRON_SECRET — ห้าม middleware เด้ง /login)
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

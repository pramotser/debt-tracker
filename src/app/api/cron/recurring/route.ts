// Vercel Cron — auto-generate รายการประจำเข้า ledger ทุกต้นเดือน
// schedule ใน vercel.json = "5 0 1 * *" (00:05 UTC วันที่ 1 = 07:05 ไทย วันที่ 1)
// Vercel แนบ header `Authorization: Bearer ${CRON_SECRET}` ให้อัตโนมัติเมื่อ env CRON_SECRET ถูกตั้ง

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { generateRecurringForMonth } from "@/server/recurring/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // cron วิ่ง UTC — คำนวณปี/เดือนตามเวลาไทยให้ตรงเดือนจริง
  const [year, month] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);

  const allUsers = await db.select({ id: users.id }).from(users);

  let created = 0;
  for (const u of allUsers) {
    const added = await generateRecurringForMonth(u.id, year, month);
    created += added.length;
  }

  return NextResponse.json({
    ok: true,
    year,
    month,
    users: allUsers.length,
    created,
  });
}

import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { BanksTable } from "@/features/admin/banks-table";
import { getCurrentUser } from "@/lib/auth";
import { getBankCardCount, listBanks } from "@/server/queries/banks";

export default async function BanksPage() {
  const user = await getCurrentUser();
  if (user.role !== "admin") notFound();

  const [banks, countsMap] = await Promise.all([
    listBanks(),
    getBankCardCount(),
  ]);
  const cardCounts = Object.fromEntries(countsMap);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">ธนาคาร</h1>
          <Badge variant="secondary">admin</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          ข้อมูลกลาง · ใช้ตอนเพิ่มบัตร
        </p>
      </header>

      <BanksTable initialBanks={banks} cardCounts={cardCounts} />
    </div>
  );
}

import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ConfigApp } from "@/features/v2/config/config-app";
import { getCurrentUser } from "@/lib/auth";
import { getV2Config } from "@/server/queries/v2/config";

// v2 beta — อ่านอย่างเดียวจาก schema v2 · เห็นเฉพาะ admin
export default async function V2ConfigPage() {
  const user = await getCurrentUser();
  if (user.role !== "admin") notFound();

  const config = await getV2Config();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">ข้อมูลตั้งต้น</h1>
          <Badge>v2 beta</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          ธนาคาร · หมวดหมู่ · เครือข่ายบัตร จาก schema v2 (อ่านอย่างเดียว)
        </p>
      </header>

      <ConfigApp config={config} />
    </div>
  );
}

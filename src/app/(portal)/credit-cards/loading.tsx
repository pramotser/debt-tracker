import { Loader2, Plus } from "lucide-react";

import { MonthNavSkeleton } from "@/components/layout/month-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy aria-live="polite">
      <h1 className="text-2xl font-bold">บัตรเครดิต</h1>

      {/* tabs (3 tabs) */}
      <div className="flex gap-6 border-b border-border pb-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>

      {/* month nav + add charge button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthNavSkeleton />
        <Button disabled>
          <Plus />
          เพิ่มรายการรูด
        </Button>
      </div>

      {/* horizontal card list */}
      <div className="flex gap-3 overflow-hidden pb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="min-w-[260px] gap-2 px-5 py-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-1 h-3 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>

      {/* transaction rows */}
      <Card className="gap-0 divide-y divide-border p-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <Skeleton className="h-5 w-5 rounded-sm" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </Card>

      {/* spinner — ด้านล่างสุด */}
      <div className="mt-2 flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังโหลดข้อมูล...
      </div>
    </div>
  );
}

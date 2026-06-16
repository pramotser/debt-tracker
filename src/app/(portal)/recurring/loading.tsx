import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy aria-live="polite">
      <h1 className="text-2xl font-bold">รายการค่าใช้จ่าย</h1>

      {/* tabs */}
      <div className="flex gap-6 border-b border-border pb-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-36" />
      </div>

      {/* month nav */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" disabled aria-label="เดือนก่อน">
          <ChevronLeft />
        </Button>
        <Skeleton className="h-7 w-32" />
        <Button variant="ghost" size="icon" disabled aria-label="เดือนถัดไป">
          <ChevronRight />
        </Button>
      </div>

      {/* summary card */}
      <Card className="gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-xl border bg-background px-4 py-3"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </Card>

      {/* entry rows */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="flex-row! items-center gap-3 px-4 py-3">
            <Skeleton className="h-5 w-5 rounded-sm" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <div className="flex gap-1.5">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-7 w-24" />
          </Card>
        ))}
      </div>

      {/* spinner — ด้านล่างสุด */}
      <div className="mt-2 flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังโหลดข้อมูล...
      </div>
    </div>
  );
}

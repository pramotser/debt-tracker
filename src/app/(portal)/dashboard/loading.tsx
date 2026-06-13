import { Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy aria-live="polite">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* tabs */}
      <div className="flex gap-6 border-b border-border pb-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-5 w-36" />
      </div>

      {/* this-month: KPI summary card */}
      <Card className="gap-4 p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-xl border bg-background px-4 py-3"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </Card>

      {/* trend + donut */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="gap-3 p-4 sm:p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[220px] w-full" />
        </Card>
        <Card className="gap-3 p-4 sm:p-6">
          <Skeleton className="h-5 w-44" />
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-[180px] w-[180px] rounded-full" />
            <div className="w-full space-y-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-2.5 w-2.5 rounded-sm" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* spinner */}
      <div className="mt-2 flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังโหลดข้อมูล...
      </div>
    </div>
  );
}

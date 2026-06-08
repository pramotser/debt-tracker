import { Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy aria-live="polite">
      <h1 className="text-2xl font-bold">ค่าใช้จ่ายรายเดือน</h1>

      {/* tabs */}
      <div className="flex gap-6 border-b border-border pb-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* month nav + loading badge + add button */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            กำลังโหลด...
          </span>
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* summary card */}
      <Card className="flex-row! flex-wrap items-center gap-x-10 gap-y-3 px-6 py-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      </Card>

      {/* entry rows */}
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex-row! items-center gap-3 px-4 py-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </Card>
        ))}
      </div>
    </div>
  );
}

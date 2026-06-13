"use client";

import type { DashboardV2Data } from "./types";

export function ThisMonthTab({ data: _data }: { data: DashboardV2Data }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      (this-month tab — รอ task 3)
    </div>
  );
}

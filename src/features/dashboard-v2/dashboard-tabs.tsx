"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { OverviewTab } from "./overview-tab";
import { ThisMonthTab } from "./this-month-tab";
import type { DashboardV2Data } from "./types";

type TabValue = "this-month" | "overview";

const tabTriggerClass =
  "-mb-px flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-2 pb-3 text-sm font-medium text-muted-foreground after:hidden data-active:border-primary! data-active:bg-transparent! data-active:font-semibold data-active:text-primary!";

export function DashboardTabs({ data }: { data: DashboardV2Data }) {
  return (
    <Tabs defaultValue={"this-month" satisfies TabValue}>
      <TabsList className="w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
        <TabsTrigger value="this-month" className={tabTriggerClass}>
          เดือนนี้ต้องจ่ายอะไรบ้าง
        </TabsTrigger>
        <TabsTrigger value="overview" className={tabTriggerClass}>
          ภาพรวมรายจ่าย
        </TabsTrigger>
      </TabsList>

      <TabsContent value="this-month" className="mt-4" keepMounted>
        <ThisMonthTab data={data} />
      </TabsContent>
      <TabsContent value="overview" className="mt-4" keepMounted>
        <OverviewTab data={data} />
      </TabsContent>
    </Tabs>
  );
}

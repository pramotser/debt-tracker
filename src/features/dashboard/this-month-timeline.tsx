"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarOff, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEDGER_TYPE_META } from "@/features/ledger/types";
import { formatMoney, formatMonthShortTh } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TimelineItem } from "@/server/queries/dashboard";

// ชื่อบัตรถ้ามี (credit_card / installment) ไม่งั้น fallback เป็น label ของ type
function sourceLabel(item: TimelineItem): string {
  return item.cardName ?? LEDGER_TYPE_META[item.type].label;
}

type Status = { text: string; className: string; icon: ReactNode };

// สถานะแบบสั้น (รับเฉพาะ item ที่ยังไม่จ่าย) · day == null → ไม่มี pill (คอลัมน์วันบอกแล้ว)
function getStatus(item: TimelineItem, todayDay: number): Status | null {
  if (item.day == null) return null;
  const diff = item.day - todayDay;
  if (diff < 0) {
    return {
      text: `เลย ${-diff} วัน`,
      className: "text-rose-600 dark:text-rose-400",
      icon: <AlertTriangle className="size-3.5 shrink-0" />,
    };
  }
  if (diff === 0) {
    return {
      text: "วันนี้",
      className: "text-orange-600 dark:text-orange-400",
      icon: <Clock className="size-3.5 shrink-0" />,
    };
  }
  return {
    text: `อีก ${diff} วัน`,
    className:
      diff <= 3
        ? "text-orange-600 dark:text-orange-400"
        : "text-muted-foreground",
    icon: <Clock className="size-3.5 shrink-0" />,
  };
}

export function ThisMonthTimeline({
  items,
  year,
  month,
  todayDay,
}: {
  items: TimelineItem[];
  year: number;
  month: number;
  todayDay: number;
}) {
  // โชว์เฉพาะที่ยังต้องจ่าย · ของเต็ม (รวมจ่ายแล้ว) อยู่ที่ /ledger ผ่านลิงก์ท้ายการ์ด
  const unpaidDated = items.filter((i) => !i.paid && i.day != null);
  const unpaidNoDay = items.filter((i) => !i.paid && i.day == null);

  const dueCount = unpaidDated.length + unpaidNoDay.length;
  const dueTotal = [...unpaidDated, ...unpaidNoDay].reduce(
    (s, i) => s + (i.amount ?? 0),
    0
  );

  // แทรกเส้น "วันนี้" หน้ารายการแรกที่ day >= วันนี้ (-1 = เลยวันนี้หมด → ไว้ท้าย)
  const todayMarkerAt = unpaidDated.findIndex((i) => (i.day ?? 0) >= todayDay);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">ต้องจ่ายอะไรเดือนนี้</CardTitle>
        {dueCount > 0 ? (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            ค้าง {dueCount} ·{" "}
            <span className="font-medium tabular-nums text-foreground">
              {formatMoney(dueTotal)}
            </span>
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            ยังไม่มีรายการเดือนนี้
          </div>
        ) : (
          <div className="flex flex-col">
            {dueCount === 0 ? (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                จ่ายครบทุกรายการแล้ว 🎉
              </div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto pr-1">
                {unpaidDated.map((item, i) => {
                  // เส้นวันนี้: โชว์เฉพาะตอนมี overdue อยู่เหนือมัน (ไม่งั้นลอยบนสุดเปล่าๆ)
                  const showMarker = i === todayMarkerAt && todayMarkerAt > 0;
                  // ยุบวันซ้ำ: โชว์วัน+สถานะเฉพาะรายการแรกของแต่ละวัน
                  const showMeta = i === 0 || unpaidDated[i - 1].day !== item.day;
                  return (
                    <div key={item.id}>
                      {showMarker ? <TodayMarker day={todayDay} /> : null}
                      <Row
                        item={item}
                        month={month}
                        todayDay={todayDay}
                        showMeta={showMeta}
                      />
                    </div>
                  );
                })}
                {unpaidDated.length > 0 && todayMarkerAt === -1 ? (
                  <TodayMarker day={todayDay} />
                ) : null}

                {unpaidNoDay.map((item, i) => (
                  <Row
                    key={item.id}
                    item={item}
                    month={month}
                    todayDay={todayDay}
                    showMeta={i === 0}
                  />
                ))}
              </div>
            )}

            <Link
              href={`/ledger?y=${year}&m=${month}`}
              className="mt-1 flex items-center justify-center gap-1.5 border-t pt-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ดูทั้งหมดในตารางรายการ
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TodayMarker({ day }: { day: number }) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className="w-[3.25rem] shrink-0 whitespace-nowrap text-[11px] font-medium text-sky-600 dark:text-sky-400">
        {day} · วันนี้
      </span>
      <span className="h-0 flex-1 border-t border-dashed border-sky-400/70" />
    </div>
  );
}

function Row({
  item,
  month,
  todayDay,
  showMeta,
}: {
  item: TimelineItem;
  month: number;
  todayDay: number;
  showMeta: boolean; // false = รายการถัดมาในวันเดียวกัน → ซ่อนวัน + สถานะ (กันซ้ำ)
}) {
  const status = showMeta ? getStatus(item, todayDay) : null;
  const isOverdue = item.day != null && item.day < todayDay;

  const dayLabel =
    item.day != null ? `${item.day} ${formatMonthShortTh(month)}` : null;

  return (
    <div className="flex items-center gap-2.5 border-b py-1.5 last:border-b-0">
      <span
        className={cn(
          "w-[3.25rem] shrink-0 whitespace-nowrap text-[11px] font-medium tabular-nums",
          isOverdue ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
        )}
      >
        {!showMeta ? null : (
          dayLabel ?? (
            <span className="inline-flex items-center gap-0.5">
              <CalendarOff className="size-3" /> ไม่ระบุ
            </span>
          )
        )}
      </span>

      <span className="min-w-0 flex-1 truncate text-sm">
        {item.name}
        <span className="text-xs text-muted-foreground">
          {" · "}
          {sourceLabel(item)}
        </span>
      </span>

      {status ? (
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px]",
            status.className
          )}
        >
          {status.icon}
          {status.text}
        </span>
      ) : null}

      <span className="shrink-0 whitespace-nowrap text-sm font-medium tabular-nums">
        {item.amount == null ? "—" : formatMoney(item.amount)}
      </span>
    </div>
  );
}

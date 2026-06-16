"use client";

import { useMemo, useState } from "react";

import { MONTHLY_DEMO_ITEMS, formatDemoNumber } from "../constants";

type State = boolean[];

export function LandingMonthlyDemo() {
  const [paidState, setPaidState] = useState<State>(() =>
    MONTHLY_DEMO_ITEMS.map(() => false)
  );

  const { total, paid, pending } = useMemo(() => {
    const totalSum = MONTHLY_DEMO_ITEMS.reduce((s, i) => s + i.amount, 0);
    const paidSum = MONTHLY_DEMO_ITEMS.reduce(
      (s, item, i) => s + (paidState[i] ? item.amount : 0),
      0
    );
    return { total: totalSum, paid: paidSum, pending: totalSum - paidSum };
  }, [paidState]);

  void total;

  return (
    <div className="rounded-2xl border border-foreground/10 bg-muted/40 p-4">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <SumMini label="ค้างจ่าย" value={formatDemoNumber(pending)} tone="amber" />
        <SumMini label="จ่ายแล้ว" value={formatDemoNumber(paid)} tone="green" />
      </div>
      <ul className="space-y-2">
        {MONTHLY_DEMO_ITEMS.map((item, i) => {
          const isPaid = paidState[i];
          return (
            <li key={item.name}>
              <button
                type="button"
                onClick={() =>
                  setPaidState((prev) => {
                    const next = [...prev];
                    next[i] = !next[i];
                    return next;
                  })
                }
                aria-pressed={isPaid}
                className="flex w-full items-center gap-3 rounded-xl border border-foreground/10 bg-card px-3 py-2.5 text-left transition-colors hover:bg-card/80"
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                    isPaid
                      ? "border-[#2E9E6B] bg-[#2E9E6B]"
                      : "border-foreground/15"
                  }`}
                >
                  {isPaid && (
                    <svg viewBox="0 0 24 24" fill="none" className="size-2.5">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="#fff"
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span
                  className={`flex-1 text-sm ${isPaid ? "text-muted-foreground line-through" : ""}`}
                >
                  {item.name}
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-muted/60 px-2 py-px text-[10.5px] text-muted-foreground">
                    <span
                      className="grid size-[13px] place-items-center rounded-[4px] text-[7px] text-white"
                      style={{ background: item.color }}
                    >
                      {item.icon}
                    </span>
                    {item.category}
                  </span>
                </span>
                <span
                  className={`font-mono text-sm font-semibold ${isPaid ? "text-muted-foreground" : ""}`}
                >
                  {formatDemoNumber(item.amount)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SumMini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "green";
}) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-card px-3 py-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div
        className={`mt-0.5 font-mono text-base font-semibold tabular-nums ${tone === "green" ? "text-[#2E9E6B]" : "text-[#DD7A2E]"}`}
      >
        {value}
      </div>
    </div>
  );
}

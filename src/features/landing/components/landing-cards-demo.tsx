import { CARD_COLOR_THEMES, type CardColor } from "@/lib/banks";

import { formatDemoNumber } from "../constants";

type DemoCard = {
  bank: string;
  color: CardColor;
  last4: string;
  bill: number;
  count: number;
};

const DEMO_CARDS: DemoCard[] = [
  { bank: "UOB Premier", color: "navy", last4: "4821", bill: 12380, count: 8 },
  { bank: "KBank", color: "teal", last4: "0917", bill: 4250, count: 3 },
  { bank: "TTB", color: "blue", last4: "3304", bill: 2100, count: 2 },
  { bank: "SCB First", color: "plum", last4: "5612", bill: 6890, count: 4 },
];

export function LandingCardsDemo() {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-muted/40 p-4">
      <div className="mb-3 text-[11px] text-muted-foreground">บัตรของฉัน</div>

      <div className="-mx-1 flex gap-5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        {DEMO_CARDS.map((card) => {
          const theme = CARD_COLOR_THEMES[card.color];
          return (
            <div
              key={card.bank}
              className="relative min-w-[220px] shrink-0 rounded-2xl p-4 shadow-sm"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                color: theme.fg,
              }}
            >
              <div className="truncate text-sm font-semibold">{card.bank}</div>
              <div className="text-xs opacity-80">•••• {card.last4}</div>

              <div className="mt-3 text-xs opacity-80">ยอดบิลเดือนนี้</div>
              <div className="text-2xl font-bold tabular-nums">
                ฿{formatDemoNumber(card.bill)}
              </div>
              <div className="mt-1 text-xs opacity-80">
                {card.count} รายการ
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <svg viewBox="0 0 24 24" fill="none" className="size-3">
          <path
            d="M9 6l-6 6 6 6M15 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        คลิกบัตรเพื่อกรองรายการเฉพาะใบนั้น
      </div>
    </div>
  );
}

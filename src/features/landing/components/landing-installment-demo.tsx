import { INSTALLMENT_DEMO, formatDemoNumber } from "../constants";

// Mirror real StatusBadge — token "active" (กำลังผ่อน)
const STATUS_ACTIVE = { bg: "#E6EEFB", text: "#1E40AF", bar: "#2563EB" };

export function LandingInstallmentDemo() {
  const {
    name,
    card,
    cardLast4,
    category,
    paid,
    current,
    total,
    remaining,
    monthlyAmount,
    expectedEnd,
  } = INSTALLMENT_DEMO;
  const totalAmount = monthlyAmount * total;

  return (
    <div className="rounded-2xl border border-foreground/10 bg-muted/40 p-4">
      <div className="flex flex-col gap-3 rounded-xl border border-foreground/10 bg-card px-5 py-4 shadow-sm">
        {/* header: name + CategoryBadge + StatusBadge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-base font-semibold text-[#16243F]">
                {name}
              </div>
              <CategoryBadgeMock category={category} />
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {card} (****{cardLast4})
            </div>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: STATUS_ACTIVE.bg, color: STATUS_ACTIVE.text }}
          >
            <span
              aria-hidden
              className="inline-block size-1.5 rounded-full"
              style={{ background: STATUS_ACTIVE.bar }}
            />
            กำลังผ่อน
          </span>
        </div>

        {/* 3-stat grid (matches PlanCard post-Solution2) */}
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-foreground/10 bg-muted/30 px-3 py-2.5">
          <Stat label="ค่างวด/เดือน" value={`฿${formatDemoNumber(monthlyAmount)}`} />
          <Stat
            label="คงเหลือ"
            value={`฿${formatDemoNumber(remaining)}`}
            emphasize
          />
          <Stat label="ยอดรวม" value={`฿${formatDemoNumber(totalAmount)}`} />
        </div>

        {/* Segments — 10 pills + numbers underneath (mirror real Segments) */}
        <SegmentsMock total={total} paidCount={paid} current={current} />

        {/* footer row */}
        <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span>
            งวด {paid} / {total}
          </span>
          <span>คาดว่าจะจบ : {expectedEnd}</span>
        </div>
      </div>
    </div>
  );
}

function CategoryBadgeMock({
  category,
}: {
  category: { name: string; bg: string; fg: string };
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-foreground/10 bg-background px-2 py-0.5 text-xs">
      <span
        className="flex size-4 items-center justify-center rounded-sm text-[9px] font-bold"
        style={{ background: category.bg, color: category.fg }}
      >
        ฿
      </span>
      <span className="truncate">{category.name}</span>
    </span>
  );
}

function SegmentsMock({
  total,
  paidCount,
  current,
}: {
  total: number;
  paidCount: number;
  current?: number;
}) {
  const items = Array.from({ length: total }, (_, i) => {
    const idx = i + 1;
    const state: "paid" | "current" | "future" =
      idx <= paidCount
        ? "paid"
        : current !== undefined && idx === current
          ? "current"
          : "future";
    return { idx, state };
  });

  const cols = { gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` };

  return (
    <div className="w-full">
      <div className="grid gap-[3px]" style={cols}>
        {items.map((it) => (
          <span
            key={it.idx}
            aria-hidden
            className={`h-2 rounded-full ${
              it.state === "paid"
                ? "bg-[#16A34A]"
                : it.state === "current"
                  ? "bg-[#2563EB]"
                  : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div
        className="mt-1 grid gap-[3px] text-[10px] tabular-nums text-muted-foreground"
        style={cols}
      >
        {items.map((it) => (
          <span key={it.idx} className="text-center">
            {it.idx}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-0 text-center">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div
        className={`mt-0.5 truncate font-semibold tabular-nums ${
          emphasize ? "text-foreground text-lg" : "text-sm"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

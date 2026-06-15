import { MONTHLY_DEMO_ITEMS, formatDemoNumber } from "../constants";

export function LandingMonthlyDemoStatic() {
  const total = MONTHLY_DEMO_ITEMS.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="rounded-2xl border border-foreground/10 bg-muted/40 p-4">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <SumMini label="ค้างจ่าย" value={formatDemoNumber(total)} tone="amber" />
        <SumMini label="จ่ายแล้ว" value="0" tone="green" />
      </div>
      <ul className="space-y-2">
        {MONTHLY_DEMO_ITEMS.map((item) => (
          <li
            key={item.name}
            className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-card px-3 py-2.5"
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-foreground/15" />
            <span className="flex-1 text-sm">
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
            <span className="font-mono text-sm font-semibold">
              {formatDemoNumber(item.amount)}
            </span>
          </li>
        ))}
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
        className={`mt-0.5 font-mono text-base font-semibold ${tone === "green" ? "text-[#2E9E6B]" : "text-[#DD7A2E]"}`}
      >
        {value}
      </div>
    </div>
  );
}

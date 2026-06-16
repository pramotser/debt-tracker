import { formatDemoNumber } from "../constants";

// 6-month bars — matches real monthly-trend-chart.tsx visual structure
const MONTHS = ["ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค."];
const SERIES = [4800, 8200, 6500, 11400, 9100, 14400];

// heatmap: 12 เดือน × level 0-3
const HEATMAP = [0, 1, 2, 2, 3, 2, 3, 1, 2, 2, 1, 0];
const LEVEL_BG = ["#E9EDF1", "#C9E2D6", "#7FCFA8", "#2E9E6B"];

// category-flow demo (mirror real CategoryFlowList layout)
const CATEGORIES = [
  { name: "สินเชื่อ/เช่าซื้อ", icon: "฿", colorBg: "#FEE4E2", colorFg: "#B42318", total: 35035, ratio: 1 },
  { name: "ของขวัญ/บริจาค", icon: "🎁", colorBg: "#FEE4E2", colorFg: "#B42318", total: 33860, ratio: 0.96 },
  { name: "ชำระบิล", icon: "💧", colorBg: "#FEF0C7", colorFg: "#B54708", total: 1200, ratio: 0.09 },
];

export function LandingDashboardDemo() {
  return (
    <div className="space-y-3 rounded-2xl border border-foreground/10 bg-muted/40 p-4">
      {/* แนวโน้ม 6 เดือนย้อนหลัง — mirror real monthly-trend-chart.tsx (title + BarChart) */}
      <div className="rounded-xl border border-foreground/10 bg-card p-4">
        {/* MoM = (เดือนล่าสุด − เดือนก่อน) / เดือนก่อน · (14400 − 9100) / 9100 ≈ +58% */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-[13px] font-semibold text-[#16243F]">
            แนวโน้ม 6 เดือนย้อนหลัง
          </div>
          <span
            title="เทียบเดือนก่อนหน้า"
            className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-emerald-700"
          >
            +58%
          </span>
        </div>

        <div className="flex gap-2">
          {/* Y-axis ticks (k-formatted, mirror real recharts YAxis tickFormatter) */}
          <div className="flex h-[150px] flex-col justify-between font-mono text-[9px] text-muted-foreground">
            <span>15k</span>
            <span>10k</span>
            <span>5k</span>
            <span>0</span>
          </div>

          {/* chart area: dashed grid + bars */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[150px] flex-col justify-between">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-px border-t border-dashed border-foreground/10"
                />
              ))}
            </div>

            <div className="relative flex h-[150px] items-end gap-2">
              {SERIES.map((value, i) => {
                const h = Math.round((value / 15000) * 150);
                return (
                  <div
                    key={MONTHS[i]}
                    className="flex-1 rounded-t-md bg-[#1B2A45]"
                    style={{ height: `${h}px`, minHeight: 4 }}
                  />
                );
              })}
            </div>

            <div className="mt-1 flex gap-2">
              {MONTHS.map((m) => (
                <span
                  key={m}
                  className="flex-1 text-center text-[10px] text-muted-foreground"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2-col on desktop: heatmap + category flow */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* heatmap */}
        <div className="rounded-xl border border-foreground/10 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[13px] font-semibold text-[#16243F]">
              ภาระรายเดือน · 2026
            </div>
            <div className="flex items-center gap-1 text-[9.5px] text-muted-foreground">
              <span>น้อย</span>
              {LEVEL_BG.map((bg) => (
                <span
                  key={bg}
                  className="size-2 rounded-[3px]"
                  style={{ background: bg }}
                />
              ))}
              <span>มาก</span>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-1">
            {HEATMAP.map((level, i) => (
              <div
                key={i}
                className="aspect-square rounded-[4px]"
                style={{ background: LEVEL_BG[level] }}
                title={`เดือนที่ ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* เงินไหลไปหมวดไหน */}
        <div className="rounded-xl border border-foreground/10 bg-card p-4">
          <div className="mb-3 text-[13px] font-semibold text-[#16243F]">
            เงินไหลไปหมวดไหน
          </div>
          <ul className="flex flex-col gap-2">
            {CATEGORIES.map((c) => (
              <li key={c.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="flex min-w-0 items-center gap-1.5 truncate">
                    <span
                      className="grid size-[18px] shrink-0 place-items-center rounded-md text-[10px]"
                      style={{ background: c.colorBg, color: c.colorFg }}
                    >
                      {c.icon}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="font-mono text-[11px] font-semibold tabular-nums">
                    ฿{formatDemoNumber(c.total)}
                  </span>
                </div>
                <div className="h-[5px] overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-[#16243F]"
                    style={{ width: `${c.ratio * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

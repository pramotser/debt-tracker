import { formatDemoNumber } from "../constants";

// 6-month line — mirror real monthly-trend-chart.tsx (LineChart + monotone)
const MONTHS = ["ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค."];
const SERIES = [4800, 8200, 6500, 11400, 9100, 14400];
const Y_MAX = 15000;

// จุดในระบบ viewBox 100×100 (preserveAspectRatio=none + non-scaling-stroke)
const POINTS = SERIES.map((v, i) => ({
  x: (i / (SERIES.length - 1)) * 100,
  y: (1 - v / Y_MAX) * 100,
}));

// Catmull-Rom → cubic bezier ให้โค้งนุ่มแบบ type="monotone"
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  const d = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

const LINE_PATH = smoothPath(POINTS);
const AREA_PATH = `${LINE_PATH} L 100 100 L 0 100 Z`;

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

          {/* chart area: dashed grid + line (mirror real LineChart) */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[150px] flex-col justify-between">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-px border-t border-dashed border-foreground/10"
                />
              ))}
            </div>

            <div className="relative h-[150px]">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full overflow-visible"
              >
                <path d={AREA_PATH} fill="#16243F" fillOpacity={0.06} />
                <path
                  d={LINE_PATH}
                  fill="none"
                  stroke="#16243F"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* dots — div แยกไว้ให้กลมเป๊ะ (svg ถูก stretch แนวนอน) */}
              {POINTS.map((p, i) => (
                <span
                  key={MONTHS[i]}
                  className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#16243F]"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                />
              ))}
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

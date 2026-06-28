import { formatDemoNumber } from "../constants";

/* ──────────────────────────────────────────────────────────────────────────
   Landing "Dashboard" demo — mirror หน้า dashboard จริง (overview tab):
   - แนวโน้ม 6 เดือนย้อนหลัง   → monthly-trend-chart.tsx (LineChart monotone)
   - รายจ่าย 6 เดือนข้างหน้า    → upcoming-chart.tsx (LineChart monotone)
   - ความหนาแน่นภาระรายเดือน    → monthly-heatmap.tsx (แท่งแนวตั้ง ไล่เฉด)
   - เงินไหลไปหมวดไหน           → category-flow-list.tsx
   badge logic เหมือนจริง: แนวโน้มขึ้น = แดง · ลง = เขียว
   ────────────────────────────────────────────────────────────────────────── */

const PAST_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย."];
const FUTURE_MONTHS = ["ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
// (last − first) / first → ผูกกับ badge เหมือน computeTrendPct จริง
const TREND_SERIES = [31000, 29500, 28000, 29000, 28200, 33500]; // +8%
const UPCOMING_SERIES = [25800, 25800, 25800, 25800, 22000, 19400]; // −25%

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

function kFmt(v: number) {
  return v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v));
}

export function LandingDashboardDemo() {
  return (
    <div className="space-y-3 rounded-2xl border border-foreground/10 bg-muted/40 p-4">
      {/* แถว 1: กราฟเส้น 2 อัน (ย้อนหลัง | ข้างหน้า) — mirror real row 1 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniLineChart
          title="แนวโน้ม 6 เดือนย้อนหลัง"
          months={PAST_MONTHS}
          series={TREND_SERIES}
          badge="+8%"
          badgeTone="up"
        />
        <MiniLineChart
          title="รายจ่าย 6 เดือนข้างหน้า"
          subtitle="ประมาณการ · รวมรายการประจำที่คาดว่าจะเกิด"
          months={FUTURE_MONTHS}
          series={UPCOMING_SERIES}
          badge="−25%"
          badgeTone="down"
        />
      </div>

      {/* แถว 2: heatmap แท่งแนวตั้ง | เงินไหลไปหมวดไหน — mirror real row 2/3 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <MonthlyHeatmapDemo />
        <CategoryFlowDemo />
      </div>
    </div>
  );
}

/* ── กราฟเส้น mini (mirror monthly-trend-chart / upcoming-chart) ─────────── */
function MiniLineChart({
  title,
  subtitle,
  months,
  series,
  badge,
  badgeTone,
}: {
  title: string;
  subtitle?: string;
  months: string[];
  series: number[];
  badge: string;
  badgeTone: "up" | "down";
}) {
  const yMax = Math.ceil((Math.max(...series) * 1.1) / 4000) * 4000;
  const points = series.map((v, i) => ({
    x: (i / (series.length - 1)) * 100,
    y: (1 - v / yMax) * 100,
  }));
  const linePath = smoothPath(points);
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;
  const ticks = [yMax, Math.round((yMax * 2) / 3), Math.round(yMax / 3), 0];

  return (
    <div className="rounded-xl border border-foreground/10 bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-[#16243F]">{title}</div>
          {subtitle ? (
            <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {subtitle}
            </div>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
            badgeTone === "up"
              ? "bg-rose-50 text-rose-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {badge}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        {/* Y-axis ticks (k-formatted, mirror recharts YAxis tickFormatter) */}
        <div className="flex h-[150px] flex-col justify-between font-mono text-[9px] text-muted-foreground">
          {ticks.map((t) => (
            <span key={t}>{kFmt(t)}</span>
          ))}
        </div>

        <div className="relative flex-1">
          {/* dashed grid */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[150px] flex-col justify-between">
            {ticks.map((_, i) => (
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
              <path d={areaPath} fill="#16243F" fillOpacity={0.06} />
              <path
                d={linePath}
                fill="none"
                stroke="#16243F"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {/* dots — div แยกไว้ให้กลมเป๊ะ (svg ถูก stretch แนวนอน) */}
            {points.map((p, i) => (
              <span
                key={months[i]}
                className="absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#16243F]"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              />
            ))}
          </div>

          <div className="mt-1 flex gap-2">
            {months.map((m) => (
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
  );
}

/* ── heatmap แท่งแนวตั้ง (mirror monthly-heatmap.tsx) ─────────────────────── */
const HEAT_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];
// ระดับ 0-4 เหมือน INTENSITY_STOPS จริง (bg-muted + เขียว 4 สเต็ป)
const HEAT_LEVELS = [2, 2, 3, 2, 3, 2, 4, 3, 4, 3, 2, 1];
const INTENSITY_STOPS = [
  "bg-muted",
  "bg-emerald-200",
  "bg-emerald-400",
  "bg-emerald-600",
  "bg-emerald-800",
];

function MonthlyHeatmapDemo() {
  return (
    <div className="rounded-xl border border-foreground/10 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-semibold text-[#16243F]">
          ความหนาแน่นภาระรายเดือน
        </div>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          2026
        </span>
      </div>

      <div className="grid grid-cols-12 gap-1">
        {HEAT_LEVELS.map((lv, i) => (
          <div key={HEAT_MONTHS[i]} className="flex flex-col items-center gap-1">
            <div
              className={`h-14 w-full rounded-[4px] ${INTENSITY_STOPS[lv]}`}
              title={HEAT_MONTHS[i]}
            />
            <span className="text-[6.5px] leading-none text-muted-foreground">
              {HEAT_MONTHS[i]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[9.5px] text-muted-foreground">
        <span>น้อย</span>
        <div className="flex gap-1">
          {INTENSITY_STOPS.map((c, i) => (
            <span key={i} className={`size-2.5 rounded-sm ${c}`} />
          ))}
        </div>
        <span>มาก</span>
      </div>
    </div>
  );
}

/* ── category flow (mirror category-flow-list.tsx) ───────────────────────── */
const CATEGORIES = [
  { name: "สินเชื่อ/เช่าซื้อ", icon: "฿", colorBg: "#FEE4E2", colorFg: "#B42318", total: 35035, ratio: 1 },
  { name: "ของขวัญ/บริจาค", icon: "🎁", colorBg: "#FEE4E2", colorFg: "#B42318", total: 33860, ratio: 0.96 },
  { name: "ชำระบิล", icon: "💧", colorBg: "#FEF0C7", colorFg: "#B54708", total: 1200, ratio: 0.09 },
];

function CategoryFlowDemo() {
  return (
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
  );
}

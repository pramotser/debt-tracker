import {
  CATEGORY_FLOW,
  DONUT_BREAKDOWN,
  INSTALLMENT_DEMO,
  formatDemoNumber,
} from "../constants";

export function LandingPhoneMockup() {
  const installPct = Math.round(
    (INSTALLMENT_DEMO.current / INSTALLMENT_DEMO.total) * 100
  );

  let cursor = 0;
  const donutStops = DONUT_BREAKDOWN.map((seg) => {
    const start = cursor;
    cursor += seg.pct;
    return `${seg.color} ${start}% ${cursor}%`;
  }).join(", ");

  return (
    <div className="relative flex justify-center">
      <div className="absolute left-1/2 top-1/2 -z-0 size-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(46,158,107,0.16),transparent_68%)]" />
      <div
        className="relative z-10 w-[280px] rounded-[42px] bg-[#0d1421] p-[11px] shadow-[0_40px_80px_-30px_rgba(22,36,63,0.5),0_0_0_1px_rgba(22,36,63,0.06)] sm:w-[300px]"
      >
        <div className="relative flex h-[600px] flex-col overflow-hidden rounded-[32px] bg-[#F1F3F5]">
          <span className="absolute left-1/2 top-0 z-[5] h-[26px] w-[120px] -translate-x-1/2 rounded-b-2xl bg-[#0d1421]" />

          <div className="flex-1 overflow-hidden px-4 pt-[30px]">
            <h3 className="mb-3 text-[21px] font-bold text-[#16243F]">Dashboard</h3>

            <div className="mb-3.5 flex gap-4 border-b border-[#E4EAE7] pb-2.5 text-[12.5px] text-[#8A99AD]">
              <span>เดือนนี้ต้องจ่ายอะไรบ้าง</span>
              <span className="relative font-semibold text-[#16243F]">
                ภาพรวมรายจ่าย
                <span className="absolute -bottom-2.5 left-0 right-0 h-[2.5px] rounded-sm bg-[#16243F]" />
              </span>
            </div>

            {/* donut card */}
            <PhoneCard title="รายจ่ายตามประเภท">
              <div className="flex items-center gap-3.5">
                <div
                  className="relative grid size-[90px] shrink-0 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(${donutStops})`,
                  }}
                >
                  <div className="size-[54px] rounded-full bg-white" />
                </div>
                <ul className="flex-1 text-[11px]">
                  {DONUT_BREAKDOWN.map((row) => (
                    <li
                      key={row.label}
                      className="mb-1.5 flex items-center gap-1.5 text-[#4B5B73]"
                    >
                      <span
                        className="size-[9px] shrink-0 rounded-[3px]"
                        style={{ background: row.color }}
                      />
                      {row.label}
                      <span className="ml-auto font-mono font-semibold text-[#16243F]">
                        {row.pct}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </PhoneCard>

            {/* category flow card */}
            <PhoneCard title="เงินไหลไปหมวดไหน">
              {CATEGORY_FLOW.map((row) => (
                <div key={row.name} className="mb-2">
                  <div className="mb-1 flex items-center gap-2 text-[11.5px]">
                    <span
                      className="grid size-[18px] place-items-center rounded-md text-[9px] text-white"
                      style={{ background: row.color }}
                    >
                      {row.icon}
                    </span>
                    {row.name}
                    <span className="ml-auto font-mono text-[11px] font-semibold">
                      {formatDemoNumber(row.amount)}
                    </span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-[#D7E0DB]">
                    <span
                      className="block h-full rounded-full bg-[#16243F]"
                      style={{ width: `${row.widthPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </PhoneCard>

            {/* installment progress card */}
            <PhoneCard title="ความคืบหน้าผ่อนชำระ" lastInline>
              <div className="mb-0.5 flex justify-between text-[12px]">
                <b>{INSTALLMENT_DEMO.name}</b>
                <span className="font-mono">
                  {INSTALLMENT_DEMO.current}/{INSTALLMENT_DEMO.total} งวด
                </span>
              </div>
              <div className="mb-2 flex justify-between text-[10.5px] text-[#8A99AD]">
                <span>{INSTALLMENT_DEMO.card}</span>
                <span className="font-mono">
                  เหลือ ฿{formatDemoNumber(INSTALLMENT_DEMO.remaining)}
                </span>
              </div>
              <div className="h-[7px] overflow-hidden rounded-full bg-[#D7E0DB]">
                <span
                  className="block h-full rounded-full bg-[#16243F]"
                  style={{ width: `${installPct}%` }}
                />
              </div>
            </PhoneCard>
          </div>

          {/* bottom nav */}
          <div className="flex justify-around border-t border-[#E4EAE7] bg-white px-1 pb-3 pt-2 text-[9px] text-[#8A99AD]">
            <NavItem label="หน้าหลัก" active>
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </NavItem>
            <NavItem label="รายการค่าใช้จ่าย">
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M3 9h18M8 2v4M16 2v4M8 14h4M8 17h6" strokeLinecap="round" />
            </NavItem>
            <NavItem label="บัตร">
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18" />
            </NavItem>
            <NavItem label="ตั้งค่า">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
            </NavItem>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneCard({
  title,
  children,
  lastInline,
}: {
  title: string;
  children: React.ReactNode;
  lastInline?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#E4EAE7] bg-white p-3.5 shadow-[0_1px_2px_rgba(22,36,63,0.04),0_10px_26px_-18px_rgba(22,36,63,0.2)] ${lastInline ? "mb-0" : "mb-2.5"}`}
    >
      <div className="mb-2.5 text-[13px] font-semibold text-[#16243F]">{title}</div>
      {children}
    </div>
  );
}

function NavItem({
  label,
  active,
  children,
}: {
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-label={label}
      className={`flex flex-col items-center justify-center ${active ? "text-[#16243F]" : ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="size-[22px]"
      >
        {children}
      </svg>
    </div>
  );
}

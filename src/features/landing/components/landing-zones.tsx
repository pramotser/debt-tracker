import { LandingCardsDemo } from "./landing-cards-demo";
import { LandingDashboardDemo } from "./landing-dashboard-demo";
import { LandingInstallmentDemo } from "./landing-installment-demo";
import { LandingMonthlyDemo } from "./landing-monthly-demo";
import { RevealOnScroll } from "./reveal-on-scroll";

type Zone = {
  key: string;
  no: string;
  title: string;
  body: string;
  tags: string[];
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  demo: React.ReactNode;
  /** demo อยู่ใต้ข้อความเต็มความกว้าง — สำหรับ demo ที่ content แน่น */
  stacked?: boolean;
};

const ZONES: Zone[] = [
  {
    key: "recurring",
    no: "01",
    title: "รายการค่าใช้จ่าย",
    body: "ตั้งรายการประจำไว้ครั้งเดียว (ค่าบ้าน ค่าไฟ ค่าน้ำ Netflix ค่าส่งรถ) พอขึ้นเดือนใหม่ดึงเข้ามาทีเดียวครบ จ่ายอันไหนติ๊กอันนั้น ยอดค้างจ่ายลดลงทันที — ลองติ๊กดูได้เลย",
    tags: [
      "ยอดรวม / จ่ายแล้ว / ค้างจ่าย",
      "รายเดือน / รายปี",
      "เลื่อนดูรายเดือน",
    ],
    iconBg: "#E4F3EC",
    iconColor: "#2E9E6B",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4M8 14h6" strokeLinecap="round" />
      </>
    ),
    demo: <LandingMonthlyDemo />,
  },
  {
    key: "cards",
    no: "02",
    title: "บัตรเครดิต",
    body: "เก็บบัตรไว้หลายใบ ดูยอดบิลของเดือนนี้แยกแต่ละบัตร เพิ่มรายการรูดเองได้ ยอดค้าง/จ่ายแล้วสรุปให้เห็นชัดๆ จ่ายบัตรไหนไปแล้วบ้าง เหลือบัตรไหนที่ยังไม่ได้จ่าย",
    tags: ["รายการชำระบัตร", "บัตรของฉัน"],
    iconBg: "#E7ECF4",
    iconColor: "#16243F",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h4" strokeLinecap="round" />
      </>
    ),
    demo: <LandingCardsDemo />,
  },
  {
    key: "installment",
    no: "03",
    title: "แผนผ่อนชำระ",
    body: "ผ่อนอะไรอยู่บ้าง งวดที่เท่าไหร่ เหลืออีกกี่งวด คาดว่าจะจบเมื่อไหร่ ดูรายงวดทีละงวดได้ว่าจ่ายแล้วหรือยัง ติ๊กจ่ายตอนทำเสร็จ เห็นภาพรวมหนี้ก้อนใหญ่ทั้งหมดในหน้าเดียว",
    tags: ["รู้งวดที่จ่าย", "รู้ว่าผ่อนหมดเมื่อไหร่", "ปิดก่อนกำหนด", "คาดการณ์ยอดงวดถัดไป"],
    iconBg: "#FBEEDD",
    iconColor: "#DD7A2E",
    icon: <path d="M3 12h18M3 7h18M3 17h12" strokeLinecap="round" />,
    demo: <LandingInstallmentDemo />,
    stacked: true,
  },
  {
    key: "dashboard",
    no: "04",
    title: "Dashboard",
    body: "แนวโน้มรายจ่าย แยกตามประเภท และ มี Heatmap บอกว่าเดือนไหนภาระหนักเบาแค่ไหน วางแผนล่วงหน้าได้",
    tags: ["แนวโน้มรายจ่าย 6 เดือน", "ความแน่นของรายจ่าย", "เห็นรายจ่ายแยกตามประเภท"],
    iconBg: "#E4F3EC",
    iconColor: "#2E9E6B",
    icon: (
      <>
        <path d="M21 21H3V3" strokeLinecap="round" />
        <path d="M7 14l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    demo: <LandingDashboardDemo />,
    stacked: true,
  },
];

export function LandingZones() {
  return (
    <section id="zones" className="scroll-mt-24 py-14 sm:py-[78px]">
      <div className="mx-auto max-w-[1140px] px-6">
        <RevealOnScroll className="mb-12 max-w-[52ch]">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2E9E6B]/20 bg-[#E4F3EC]/60 px-3 py-1 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[#218355]">
            มีอะไรในแอป
          </div>
          <h2 className="text-[clamp(26px,3.4vw,38px)] font-bold leading-[1.16] tracking-[-0.02em]">
            ไม่ใช่แค่จดรายจ่าย — แต่เห็นภาพรวมทั้งหมด
          </h2>
          <p className="mt-3.5 text-[17px] leading-relaxed text-[#4B5B73]">
            ทุกอย่างที่เกี่ยวกับรายจ่ายและหนี้ที่ต้องจ่ายในแต่ละเดือน รวมไว้ที่เดียว
            จัดการได้ง่ายๆ วางแผนการเงินได้แม่นยำขึ้น เห็นภาพรวมรายจ่ายทั้งหมดในหน้าเดียว
          </p>
        </RevealOnScroll>

        <div className="space-y-5">
          {ZONES.map((zone, i) => (
            <RevealOnScroll key={zone.key}>
              <FeatureZoneCard zone={zone} reverse={!zone.stacked && i % 2 === 1} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureZoneCard({ zone, reverse }: { zone: Zone; reverse: boolean }) {
  const gridClasses = zone.stacked
    ? ""
    : "sm:grid sm:grid-cols-[1.05fr_0.95fr] sm:items-center sm:gap-9";

  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-foreground/10 bg-card p-6 shadow-[0_1px_2px_rgba(22,36,63,0.04),0_18px_40px_-26px_rgba(22,36,63,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(22,36,63,0.05),0_28px_56px_-26px_rgba(22,36,63,0.36)] sm:p-9">
      {/* top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] opacity-70 transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${zone.iconColor}, transparent 72%)`,
        }}
      />
      {/* watermark number */}
      <span
        className="pointer-events-none absolute -right-2 -top-5 select-none font-mono text-[110px] font-bold leading-none opacity-[0.04]"
        style={{ color: zone.iconColor }}
      >
        {zone.no}
      </span>

      <div className={gridClasses}>
        <div className={reverse ? "sm:order-2" : ""}>
          <div className="mb-4 flex items-center gap-3">
            <ZoneIcon bg={zone.iconBg} color={zone.iconColor}>
              {zone.icon}
            </ZoneIcon>
            <span className="font-mono text-[13px] font-semibold text-[#8A99AD]">
              {zone.no}
            </span>
          </div>
          <h3 className="mb-2 text-[20px] font-semibold tracking-[-0.01em]">
            {zone.title}
          </h3>
          <p
            className={`text-[15px] leading-relaxed text-[#4B5B73] ${
              zone.stacked ? "" : "max-w-[56ch]"
            }`}
          >
            {zone.body}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {zone.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-foreground/10 bg-muted/50 px-3 py-1 text-[12.5px] text-[#4B5B73]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div
          className={
            zone.stacked
              ? "mt-6"
              : `mt-6 min-w-0 sm:mt-0 ${reverse ? "sm:order-1" : ""}`
          }
        >
          {zone.demo}
        </div>
      </div>
    </div>
  );
}

function ZoneIcon({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid size-[46px] place-items-center rounded-2xl"
      style={{ background: bg, color }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        {children}
      </svg>
    </div>
  );
}

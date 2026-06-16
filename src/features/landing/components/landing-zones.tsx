import { LandingCardsDemo } from "./landing-cards-demo";
import { LandingDashboardDemo } from "./landing-dashboard-demo";
import { LandingInstallmentDemo } from "./landing-installment-demo";
import { LandingMonthlyDemo } from "./landing-monthly-demo";
import { RevealOnScroll } from "./reveal-on-scroll";

type Zone = {
  key: string;
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
    <section id="zones" className="py-14 sm:py-[70px]">
      <div className="mx-auto max-w-[1140px] px-6">
        <RevealOnScroll className="mb-10 max-w-[48ch]">
          <div className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#2E9E6B]">
            มีอะไรในแอป
          </div>
          <h2 className="text-[clamp(25px,3.1vw,34px)] font-bold leading-[1.22] tracking-[-0.01em]">
            ไม่ใช่แค่จดรายจ่าย — แต่เห็นภาพรวมรายจ่ายทั้งหมด
          </h2>
          <p className="mt-3 text-[17px] text-[#4B5B73]">
            ทุกอย่างที่เกี่ยวกับรายจ่ายและหนี้ที่ต้องจ่ายในแต่ละเดือน รวมไว้ที่เดียว จัดการได้ง่ายๆ วางแผนการเงินได้แม่นยำขึ้น เห็นภาพรวมรายจ่ายทั้งหมดในหน้าเดียว
          </p>
        </RevealOnScroll>

        <div className="space-y-4">
          {ZONES.map((zone) => (
            <RevealOnScroll key={zone.key}>
              <FeatureZoneCard zone={zone} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureZoneCard({ zone }: { zone: Zone }) {
  const gridClasses = zone.stacked
    ? ""
    : "sm:grid sm:grid-cols-[1.1fr_0.9fr] sm:items-center sm:gap-6";

  return (
    <div
      className={`rounded-3xl border border-foreground/10 bg-card p-6 shadow-[0_1px_2px_rgba(22,36,63,0.04),0_10px_26px_-18px_rgba(22,36,63,0.2)] sm:p-8 ${gridClasses}`}
    >
      <div>
        <ZoneIcon bg={zone.iconBg} color={zone.iconColor}>
          {zone.icon}
        </ZoneIcon>
        <h3 className="mb-2 text-[19px] font-semibold">{zone.title}</h3>
        <p
          className={`text-[15px] text-[#4B5B73] ${
            zone.stacked ? "" : "max-w-[58ch]"
          }`}
        >
          {zone.body}
        </p>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {zone.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-foreground/10 bg-muted/40 px-3 py-1 text-[12.5px] text-[#4B5B73]"
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
            : "mt-5 min-w-0 sm:mt-0"
        }
      >
        {zone.demo}
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
      className="mb-4 grid size-[46px] place-items-center rounded-2xl"
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

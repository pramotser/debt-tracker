import { LandingMonthlyDemo } from "./landing-monthly-demo";
import { RevealOnScroll } from "./reveal-on-scroll";

type Zone = {
  title: string;
  body: string;
  tags: string[];
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
};

const ZONES: Zone[] = [
  {
    title: "บัตรเครดิต",
    body: "เก็บบัตรไว้หลายใบ ดูยอดบิลของเดือนนี้แยกแต่ละบัตร เพิ่มรายการรูดเองได้ ยอดค้าง/จ่ายแล้วสรุปให้",
    tags: ["รายการชำระบัตร", "บัตรของฉัน"],
    iconBg: "#E7ECF4",
    iconColor: "#16243F",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h4" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "แผนผ่อนชำระ",
    body: "ผ่อนอะไรอยู่บ้าง งวดที่เท่าไหร่ เหลืออีกกี่งวด คาดว่าจะจบเมื่อไหร่ แยกเงินต้น/ดอกเบี้ยให้ เห็นภาพรวมหนี้ทั้งหมด",
    tags: ["งวด 1/10", "คาดว่าจบ 2027/02", "เงินต้น/ดอก"],
    iconBg: "#FBEEDD",
    iconColor: "#DD7A2E",
    icon: <path d="M3 12h18M3 7h18M3 17h12" strokeLinecap="round" />,
  },
  {
    title: "ภาพรวม (Dashboard)",
    body: "กราฟรายจ่าย 6 เดือนข้างหน้า วงกลมแยกตามประเภท และ heatmap บอกว่าเดือนไหนภาระหนักเบาแค่ไหน วางแผนล่วงหน้าได้",
    tags: ["รายจ่าย 6 เดือน", "heatmap รายเดือน"],
    iconBg: "#E4F3EC",
    iconColor: "#2E9E6B",
    icon: (
      <>
        <path d="M21 21H3V3" strokeLinecap="round" />
        <path d="M7 14l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
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
            ไม่ใช่แค่จดรายจ่าย — คุมหนี้ทั้งก้อนได้
          </h2>
          <p className="mt-3 text-[17px] text-[#4B5B73]">
            ทุกอย่างที่เงินไหลออกอยู่ในแอปเดียว แบ่งเป็น 4 ส่วน ใช้ต่อกันเป็นเส้นเดียว
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* feature zone: monthly cost + interactive demo */}
          <RevealOnScroll className="rounded-3xl border border-foreground/10 bg-card p-6 shadow-[0_1px_2px_rgba(22,36,63,0.04),0_10px_26px_-18px_rgba(22,36,63,0.2)] sm:col-span-2 sm:grid sm:grid-cols-[1.1fr_0.9fr] sm:items-center sm:gap-6">
            <div>
              <ZoneIcon bg="#E4F3EC" color="#2E9E6B">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M3 9h18M8 2v4M16 2v4M8 14h6" strokeLinecap="round" />
              </ZoneIcon>
              <h3 className="mb-2 text-[19px] font-semibold">ค่าใช้จ่ายรายเดือน</h3>
              <p className="text-[15px] text-[#4B5B73]">
                ตั้งรายการประจำไว้ครั้งเดียว (ค่าบ้าน ค่าไฟ ค่าน้ำ ค่าส่งรถ) พอขึ้นเดือนใหม่ดึงเข้ามาทีเดียวครบ
                จ่ายอันไหนติ๊กอันนั้น ยอดค้างจ่ายลดลงทันที — ลองติ๊กดูได้เลย
              </p>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {["ยอดรวม / จ่ายแล้ว / ค้างจ่าย", "Template รายการประจำ", "เลื่อนดูรายเดือน"].map(
                  (t) => (
                    <span
                      key={t}
                      className="rounded-full border border-foreground/10 bg-muted/40 px-3 py-1 text-[12.5px] text-[#4B5B73]"
                    >
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="mt-5 sm:mt-0">
              <LandingMonthlyDemo />
            </div>
          </RevealOnScroll>

          {ZONES.map((z) => (
            <RevealOnScroll key={z.title}>
              <ZoneCard zone={z} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function ZoneCard({ zone }: { zone: Zone }) {
  return (
    <div className="rounded-3xl border border-foreground/10 bg-card p-6 shadow-[0_1px_2px_rgba(22,36,63,0.04),0_10px_26px_-18px_rgba(22,36,63,0.2)] transition-transform hover:-translate-y-0.5">
      <ZoneIcon bg={zone.iconBg} color={zone.iconColor}>
        {zone.icon}
      </ZoneIcon>
      <h3 className="mb-2 text-[19px] font-semibold">{zone.title}</h3>
      <p className="text-[15px] text-[#4B5B73]">{zone.body}</p>
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

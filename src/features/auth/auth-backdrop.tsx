// Ambient backdrop — faux dashboard เบลอจางๆ หลัง glass card (login ฯลฯ)
// decorative ล้วน · aria-hidden · ไม่มี interaction
export function AuthBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      {/* faux dashboard — เบลอ แต่ยังเห็นว่าเป็น dashboard */}
      <div className="absolute inset-0 flex items-center justify-center opacity-90 blur-[4px]">
        <div className="w-[1100px] max-w-none scale-[1.25] px-6">
          {/* header */}
          <div className="mb-5">
            <div className="mb-3 h-6 w-40 rounded-md bg-foreground/15" />
            <div className="flex gap-5 border-b border-foreground/10 pb-2.5">
              <div className="h-3 w-44 rounded bg-foreground/20" />
              <div className="h-3 w-28 rounded bg-foreground/10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FauxCard>
              <FauxLine />
            </FauxCard>
            <FauxCard>
              <FauxDonut />
            </FauxCard>
            <FauxCard>
              <FauxKpi />
            </FauxCard>
            <FauxCard>
              <FauxCategory />
            </FauxCard>
          </div>
        </div>
      </div>

      {/* scrim เบาๆ ให้ text อ่านออก + ขอบจอจางลงนิดให้ดูนุ่ม */}
      <div className="absolute inset-0 bg-background/45" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_64%_at_50%_48%,transparent_42%,var(--background)_92%)]" />
      {/* glow เขียวหลัง card ให้ card ลอยเด่น */}
      <div className="absolute left-1/2 top-[46%] size-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(248,250,252,0.55),transparent_66%)] dark:bg-[radial-gradient(circle,rgba(15,23,42,0.55),transparent_66%)]" />
    </div>
  );
}

function FauxCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-4 shadow-sm">
      <div className="mb-3 h-3.5 w-32 rounded bg-foreground/15" />
      {children}
    </div>
  );
}

function FauxLine() {
  return (
    <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="h-[120px] w-full">
      <path
        d="M0 90 C 40 86, 60 60, 100 64 S 160 30, 200 44 240 70, 300 24"
        fill="none"
        stroke="#16243F"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M0 90 C 40 86, 60 60, 100 64 S 160 30, 200 44 240 70, 300 24 L 300 120 L 0 120 Z"
        fill="#16243F"
        fillOpacity="0.06"
      />
    </svg>
  );
}

function FauxDonut() {
  return (
    <div className="flex items-center gap-4">
      <div
        className="size-[100px] shrink-0 rounded-full"
        style={{
          background:
            "conic-gradient(#2E9E6B 0% 49%, #16243F 49% 96%, #0EA5E9 96% 100%)",
        }}
      >
        <div className="m-[26px] size-[48px] rounded-full bg-card" />
      </div>
      <div className="flex-1 space-y-2.5">
        {[60, 52, 30].map((w, i) => (
          <div key={i} className="h-2.5 rounded bg-foreground/12" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

function FauxKpi() {
  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-foreground/10 bg-foreground/[0.03] p-2.5">
            <div className="mb-2 h-2 w-10 rounded bg-foreground/12" />
            <div className="h-3.5 w-14 rounded bg-foreground/20" />
          </div>
        ))}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full w-[72%] rounded-full bg-[#22A06B]" />
      </div>
    </div>
  );
}

function FauxCategory() {
  return (
    <div className="space-y-3">
      {[100, 90, 28].map((w, i) => (
        <div key={i}>
          <div className="mb-1.5 flex items-center gap-2">
            <div className="size-4 rounded bg-foreground/15" />
            <div className="h-2.5 w-24 rounded bg-foreground/12" />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-[#16243F]" style={{ width: `${w}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

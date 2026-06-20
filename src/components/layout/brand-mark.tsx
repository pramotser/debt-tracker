// โลโก้กลางของทั้งเว็บ — source เดียว · เปลี่ยนที่นี่ที่เดียวพอเมื่อได้ไอคอนจริง
// (favicon อยู่ที่ src/app/icon.svg ต้องแก้ให้ตรงกันด้วย)

export function BrandMark({
  size = 30,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const bar = Math.round(size * 0.47);
  const barHeight = Math.max(2, Math.round(size * 0.08));

  return (
    <div className={className}>
      <div
        className="grid place-items-center bg-foreground"
        style={{ width: size, height: size, borderRadius: size * 0.3 }}
      >
        <div className="flex flex-col" style={{ gap: size * 0.1 }}>
          <span
            className="block rounded-sm bg-[#2E9E6B]"
            style={{ width: bar, height: barHeight }}
          />
          <span
            className="block rounded-sm bg-white"
            style={{ width: bar, height: barHeight }}
          />
          <span
            className="block rounded-sm bg-white"
            style={{ width: bar, height: barHeight }}
          />
        </div>
      </div>
    </div>
  );
}

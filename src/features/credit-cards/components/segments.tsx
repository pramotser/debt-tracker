import { cn } from "@/lib/utils";

// แถบงวด segmented · ใช้ทั้ง tab1 (ใต้รายการรูดผ่อน) และ tab2 (บนการ์ดแผน)
// numbers=true จะโชว์เลข 1..total ใต้แถบ (สำหรับ tab2)
export function Segments({
  total,
  paidCount,
  current,
  numbers = false,
  className,
}: {
  total: number;
  paidCount: number;
  current?: number;
  numbers?: boolean;
  className?: string;
}) {
  if (total <= 0) return null;
  const items = Array.from({ length: total }, (_, i) => {
    const idx = i + 1;
    const state: "paid" | "current" | "future" =
      idx <= paidCount
        ? "paid"
        : current !== undefined && idx === current
          ? "current"
          : "future";
    return { idx, state };
  });

  return (
    <div
      className={cn("w-full", className)}
      aria-label={`ผ่อนแล้ว ${paidCount} จาก ${total} งวด`}
    >
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {items.map((it) => (
          <span
            key={it.idx}
            aria-hidden
            className={cn(
              "h-2 rounded-full",
              it.state === "paid" && "bg-[#16A34A]",
              it.state === "current" && "bg-[#2563EB]",
              it.state === "future" && "bg-muted"
            )}
          />
        ))}
      </div>
      {numbers && (
        <div
          className="mt-1 grid gap-[3px] text-[10px] tabular-nums text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        >
          {items.map((it) => (
            <span key={it.idx} className="text-center">
              {it.idx}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

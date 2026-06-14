import { cn } from "@/lib/utils";

import { STATUS, type StatusKey } from "./status-tokens";

export function StatusBadge({
  status,
  className,
}: {
  status: StatusKey;
  className?: string;
}) {
  const tk = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={{ backgroundColor: tk.bg, color: tk.text }}
    >
      <span
        aria-hidden
        className="inline-block size-1.5 rounded-full"
        style={{ backgroundColor: tk.bar }}
      />
      {tk.label}
    </span>
  );
}

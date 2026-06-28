export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-10">
      {/* subtle product texture — faint grid + soft glow (นิ่งๆ ไม่ป้าว) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_58%_48%_at_50%_38%,#000_35%,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
        <div className="absolute left-1/2 top-[16%] size-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(46,158,107,0.08),transparent_70%)]" />
      </div>

      <div className="relative w-full max-w-[380px]">{children}</div>
    </div>
  );
}

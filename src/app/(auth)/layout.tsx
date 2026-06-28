import { AuthBackdrop } from "@/features/auth/auth-backdrop";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-10">
      <AuthBackdrop />
      <div className="relative w-full max-w-[380px]">{children}</div>
    </div>
  );
}

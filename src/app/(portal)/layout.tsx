import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { formatFullName } from "@/lib/format";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const displayName = formatFullName(user);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar displayName={displayName} />
      <BottomNav />
      <main className="md:ml-[240px]">
        <div className="mx-auto w-full max-w-6xl px-6 pt-8 pb-24 sm:px-8 sm:pt-12 md:pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}

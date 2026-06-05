import { PortalNav } from "@/components/layout/portal-nav";
import { Separator } from "@/components/ui/separator";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Debt Tracker
          </h1>
          <span className="text-xs text-muted-foreground">scaffold</span>
        </div>
        <PortalNav />
        <Separator />
      </header>
      <main className="flex flex-1 flex-col gap-6">{children}</main>
    </div>
  );
}

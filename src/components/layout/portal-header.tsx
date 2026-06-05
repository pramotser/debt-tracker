import { SidebarTrigger } from "@/components/ui/sidebar";

export function PortalHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 bg-primary px-4 text-primary-foreground sm:px-6">
      <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" />
      <span className="text-base font-semibold">Debt Tracker</span>
    </header>
  );
}

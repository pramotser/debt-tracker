import { PortalHeader } from "@/components/layout/portal-header";
import { PortalSidebar } from "@/components/layout/portal-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <PortalSidebar />
      <SidebarInset>
        <PortalHeader />
        <div className="flex-1 px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/server/actions/auth";

export async function PortalHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 bg-primary px-4 text-primary-foreground sm:px-6">
      <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" />
      <span className="text-base font-semibold">Debt Tracker</span>
      <div className="ml-auto flex items-center gap-3">
        {user?.email ? (
          <span className="hidden text-sm opacity-90 sm:inline">
            {user.email}
          </span>
        ) : null}
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="ออกจากระบบ"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <LogOut />
          </Button>
        </form>
      </div>
    </header>
  );
}

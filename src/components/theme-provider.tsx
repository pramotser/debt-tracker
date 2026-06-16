"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

const FORCED_LIGHT_ROUTES = new Set(["/"]);

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  const forcedTheme = FORCED_LIGHT_ROUTES.has(pathname) ? "light" : undefined;
  return <NextThemesProvider {...props} forcedTheme={forcedTheme} />;
}

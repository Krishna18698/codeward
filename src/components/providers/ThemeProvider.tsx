"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

/** App-wide theme provider. Writes `data-theme="dark|light"` on <html>, defaults
 *  to dark, persists the choice to localStorage, and does NOT follow the OS
 *  setting (the site is dark-first). next-themes injects a pre-hydration script
 *  so there's no flash of the wrong theme on load. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}

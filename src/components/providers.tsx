"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

/**
 * App-wide client providers.
 * next-themes drives the light/dark/system theme via a class on <html>,
 * with automatic system detection and localStorage persistence (in the
 * production app this preference is also synced to the user's DB record).
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

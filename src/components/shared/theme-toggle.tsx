"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Instant light/dark toggle with system detection (handled by next-themes). */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted",
        className
      )}
    >
      {mounted && (
        <>
          <Sun
            className={cn(
              "h-[1.1rem] w-[1.1rem] transition-all",
              isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
            )}
          />
          <Moon
            className={cn(
              "absolute h-[1.1rem] w-[1.1rem] transition-all",
              isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"
            )}
          />
        </>
      )}
    </button>
  );
}

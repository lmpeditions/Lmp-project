"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Languages } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "fr", label: "Français", short: "FR" },
  { code: "en", label: "English", short: "EN" },
] as const;

/** Instant language switch — preserves the current path. */
export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const switchTo = (code: string) => {
    // Keep the current path, only swap the locale segment.
    router.replace(pathname, { locale: code });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
      >
        <Languages className="h-4 w-4" />
        {locale.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-md border border-border bg-card p-1 shadow-lg">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => switchTo(l.code)}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted",
                locale === l.code && "text-primary font-medium"
              )}
            >
              {l.label}
              <span className="text-xs text-muted-foreground">{l.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

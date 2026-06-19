"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { BookOpen, ChevronsUpDown, Check, Plus, Clock } from "lucide-react";
import { switchBookAction } from "@/server/book-actions";
import type { BookSummary } from "@/server/queries";

export function BookSwitcher({ books, activeId }: { books: BookSummary[]; activeId: string | null }) {
  const t = useTranslations("books");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const active = books.find((b) => b.id === activeId) ?? books[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-md border border-border bg-card px-3 py-1.5 text-left transition-colors hover:bg-muted"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
          <BookOpen className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-tight">
            {active ? active.bookTitle : t("noBook")}
          </span>
          {active && (
            <span className="block truncate font-mono text-[10px] text-muted-foreground">
              {active.trackingNumber}
            </span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-72 rounded-lg border border-border bg-card p-1.5 shadow-lg">
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("yourBooks")}
          </p>
          <div className="max-h-72 space-y-0.5 overflow-y-auto">
            {books.map((b) => {
              const isPending = b.status === "PENDING_VALIDATION";
              return (
                <form key={b.id} action={switchBookAction}>
                  <input type="hidden" name="dossierId" value={b.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{b.bookTitle}</span>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <Clock className="h-3 w-3" />
                            {t("pending")}
                          </span>
                        ) : (
                          <span>{b.globalProgress}%</span>
                        )}
                      </span>
                    </span>
                    {b.id === active?.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                </form>
              );
            })}
          </div>
          <div className="mt-1 border-t border-border pt-1">
            <a
              href={`/${locale}/author/start`}
              className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              {t("newBook")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

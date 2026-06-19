"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { MessageSquareText, ChevronDown, Paperclip, Eye, EyeOff } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { RemarkView } from "@/server/queries";

/** Editorial remarks: click a remark to open its detail; "view all" previews them all. */
export function RemarksList({ remarks }: { remarks: RemarkView[] }) {
  const t = useTranslations("review");
  const locale = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (remarks.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t("noRemarks")}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          {showAll ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showAll ? t("hideAll") : t("viewAll")}
        </button>
      </div>

      <ul className="space-y-2">
        {remarks.map((r) => {
          const open = showAll || openId === r.id;
          return (
            <li key={r.id} className="overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setOpenId((o) => (o === r.id ? null : r.id))}
                className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-muted/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <MessageSquareText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate font-medium">{r.title}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {formatDate(r.date, locale)}
                  <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </span>
              </button>
              {open && (
                <div className="space-y-2 border-t border-border bg-muted/20 p-3 text-sm">
                  <p className="whitespace-pre-wrap text-muted-foreground">{r.description}</p>
                  {r.attachments.map((a) => (
                    <a
                      key={a.url}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {a.name}
                    </a>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    {t("by")} {r.authorName}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Download, Eye, MessageSquare, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { DocumentCategory, LibraryDocument } from "@/lib/types";

const CATEGORIES: DocumentCategory[] = [
  "manuscript",
  "administrative",
  "visuals",
  "cover",
  "content",
  "financial",
  "communication",
];

export function DocumentLibrary({
  documents,
  locale,
}: {
  documents: LibraryDocument[];
  locale: string;
}) {
  const t = useTranslations("documents");
  const tc = useTranslations("common");
  const [active, setActive] = useState<DocumentCategory | "all">("all");

  const filtered =
    active === "all" ? documents : documents.filter((d) => d.category === active);

  return (
    <div className="space-y-5">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActive("all")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            active === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-muted"
          )}
        >
          {t("allCategories")}
        </button>
        {CATEGORIES.map((c) => {
          const count = documents.filter((d) => d.category === c).length;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
              )}
            >
              {t(`categories.${c}`)}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Document grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((d) => (
          <Card key={d.id} className="transition-shadow hover:shadow-md">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.mimeType} · {d.size}
                  </p>
                </div>
                <Badge tone="neutral" className="shrink-0">
                  v{d.version}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{formatDate(d.date, locale)}</span>
                <span>· {tc("addedBy")} {d.addedBy}</span>
              </div>

              {d.comment && (
                <p className="flex items-start gap-1.5 rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                  {d.comment}
                </p>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-3.5 w-3.5" /> {tc("preview")}
                </Button>
                <Button size="sm" variant="ghost" className="px-2" aria-label={tc("download")}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="px-2" aria-label={tc("history")}>
                  <History className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          {tc("noResults")}
        </Card>
      )}
    </div>
  );
}

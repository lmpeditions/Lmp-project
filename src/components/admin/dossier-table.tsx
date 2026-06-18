"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { adminDossierStatusTone } from "@/lib/status";
import type { AdminDossierRow } from "@/lib/types";

type Filter = "all" | "inProgress" | "completed" | "onHold";

export function DossierTable({ rows }: { rows: AdminDossierRow[] }) {
  const t = useTranslations("adminDossiers");
  const tAdmin = useTranslations("admin");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = rows.filter((r) => {
    const matchesQuery =
      r.authorName.toLowerCase().includes(query.toLowerCase()) ||
      r.bookTitle.toLowerCase().includes(query.toLowerCase()) ||
      r.trackingNumber.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || r.status === filter;
    return matchesQuery && matchesFilter;
  });

  const filters: Filter[] = ["all", "inProgress", "completed", "onHold"];

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filter === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                )}
              >
                {t(f)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3 font-medium">#</th>
                <th className="px-3 py-3 font-medium">{tAdmin("author")}</th>
                <th className="px-3 py-3 font-medium">{tAdmin("book")}</th>
                <th className="px-3 py-3 font-medium">{tAdmin("editor")}</th>
                <th className="px-3 py-3 font-medium">{tAdmin("progress")}</th>
                <th className="px-3 py-3 font-medium">{tAdmin("status")}</th>
                <th className="px-3 py-3 font-medium">{tAdmin("openTickets")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.trackingNumber}
                  className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="px-3 py-3.5 font-mono text-xs">{row.trackingNumber}</td>
                  <td className="px-3 py-3.5 font-medium">{row.authorName}</td>
                  <td className="px-3 py-3.5 text-muted-foreground">{row.bookTitle}</td>
                  <td className="px-3 py-3.5">{row.editor}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <Progress value={row.progress} className="h-1.5 w-24" />
                      <span className="text-xs text-muted-foreground">{row.progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <Badge tone={adminDossierStatusTone[row.status]} dot>
                      {tAdmin(row.status)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3.5">
                    {row.openTickets > 0 ? (
                      <Badge tone="warning">{row.openTickets}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

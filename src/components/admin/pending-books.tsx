import { getTranslations } from "next-intl/server";
import { Clock, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateBookAction } from "@/server/book-actions";
import { formatDate } from "@/lib/utils";

export interface PendingBookRow {
  id: string;
  trackingNumber: string;
  bookTitle: string;
  authorName: string;
  description: string | null;
  createdAt: string;
}

/** Queue of author-submitted books awaiting admin validation. */
export async function PendingBooks({ rows, locale }: { rows: PendingBookRow[]; locale: string }) {
  const t = await getTranslations("adminDossiers");
  const tc = await getTranslations("common");
  if (rows.length === 0) return null;

  return (
    <Card className="border-warning/40 bg-warning/[0.04]">
      <CardHeader className="flex-row items-center gap-2">
        <Clock className="h-4 w-4 text-warning" />
        <CardTitle>
          {t("pendingTitle")} ({rows.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-3"
          >
            <div className="min-w-0">
              <p className="font-medium">{r.bookTitle}</p>
              <p className="text-xs text-muted-foreground">
                {r.authorName} · <span className="font-mono">{r.trackingNumber}</span> ·{" "}
                {formatDate(r.createdAt, locale)}
              </p>
              {r.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              )}
            </div>
            <form action={validateBookAction}>
              <input type="hidden" name="dossierId" value={r.id} />
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99]"
              >
                <Check className="h-4 w-4" />
                {tc("validate")}
              </button>
            </form>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { MessageSquare, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Link } from "@/i18n/routing";
import { getAdminTickets } from "@/server/queries";
import { formatDate } from "@/lib/utils";
import { ticketStatusTone } from "@/lib/status";

export const dynamic = "force-dynamic";
export default async function AdminTicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminTickets");
  const tTk = await getTranslations("tickets");
  const tCat = await getTranslations("tickets.categories");

  const tickets = await getAdminTickets();

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <CardTitle>{t("queue")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{tTk("noTickets")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {tickets.map((tk) => (
                <li key={tk.id}>
                  <Link href={`/admin/tickets/${tk.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40">
                    <span className="font-mono text-xs text-muted-foreground">{tk.ref}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{tk.subject}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {tk.authorName} · <span className="font-mono">{tk.trackingNumber}</span> · {tCat(tk.category)}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <Badge tone={ticketStatusTone[tk.status]} dot>{tTk(tk.status)}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(tk.updatedAt, locale)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

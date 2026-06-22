import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Plus, MessageSquare, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Link } from "@/i18n/routing";
import { getCurrentUser, getAuthorTickets } from "@/server/queries";
import { formatDate } from "@/lib/utils";
import { ticketStatusTone } from "@/lib/status";

const categoryTone: Record<string, BadgeTone> = {
  cover: "primary",
  finance: "warning",
  proofreading: "info",
  general: "neutral",
  complaint: "danger",
  communication: "info",
  technical: "neutral",
  termination: "danger",
};

export const dynamic = "force-dynamic";
export default async function TicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tickets");
  const tCat = await getTranslations("tickets.categories");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  const tickets = await getAuthorTickets(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Link href="/author/tickets/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="h-4 w-4" />
            {t("newTicket")}
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("noTickets")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {tickets.map((tk) => (
                <li key={tk.id}>
                  <Link
                    href={`/author/tickets/${tk.id}`}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{tk.ref}</span>
                        <Badge tone={categoryTone[tk.category] ?? "neutral"}>{tCat(tk.category)}</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">{tk.subject}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <Badge tone={ticketStatusTone[tk.status]} dot>
                        {t(tk.status)}
                      </Badge>
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

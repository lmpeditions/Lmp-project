import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TicketComposer } from "@/components/author/ticket-composer";
import { Link } from "@/i18n/routing";
import { demoDossier, ticketThread } from "@/lib/mock-data";
import { ticketStatusTone } from "@/lib/status";
import { cn } from "@/lib/utils";

function formatDateTime(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tickets");
  const tc = await getTranslations("common");
  const tCat = await getTranslations("tickets.categories");

  const ticket = demoDossier.tickets.find((tk) => tk.id === id) ?? demoDossier.tickets[0];
  if (!ticket) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/author/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToList")}
      </Link>

      <PageHeader title={ticket.subject} subtitle={ticket.ref} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="primary">{tCat(ticket.category)}</Badge>
        <Badge tone={ticketStatusTone[ticket.status]} dot>
          {t(ticket.status)}
        </Badge>
      </div>

      {/* Conversation thread */}
      <Card>
        <CardHeader>
          <CardTitle>{t("conversation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticketThread.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex", msg.side === "author" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  msg.side === "author"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted text-foreground"
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-4 text-xs opacity-80">
                  <span className="font-semibold">{msg.senderName}</span>
                  <span>{formatDateTime(msg.date, locale)}</span>
                </div>
                <p className="text-sm leading-relaxed">{msg.body}</p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.attachments.map((a) => (
                      <span
                        key={a}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
                          msg.side === "author" ? "bg-white/15" : "bg-card"
                        )}
                      >
                        <Paperclip className="h-3 w-3" />
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reply */}
      <Card>
        <CardContent className="pt-5">
          <TicketComposer submitLabel={tc("send")} successMessage={t("conversation")} />
        </CardContent>
      </Card>
    </div>
  );
}

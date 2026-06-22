import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TicketThread } from "@/components/shared/ticket-thread";
import { Link } from "@/i18n/routing";
import { getTicket } from "@/server/queries";
import { ticketStatusTone } from "@/lib/status";

export const dynamic = "force-dynamic";
export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tickets");

  const ticket = await getTicket(id);
  if (!ticket) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {t("backToList")}
      </Link>

      <PageHeader title={ticket.subject} subtitle={ticket.ref} />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t("conversation")}</CardTitle>
          <Badge tone={ticketStatusTone[ticket.status]} dot>
            {t(ticket.status)}
          </Badge>
        </CardHeader>
        <CardContent>
          <TicketThread ticketId={ticket.id} messages={ticket.messages} perspective="lmp" />
        </CardContent>
      </Card>
    </div>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TicketThread } from "@/components/shared/ticket-thread";
import { TicketAdminControls } from "@/components/admin/ticket-admin-controls";
import { Link } from "@/i18n/routing";
import { getTicket, getStaffUsers } from "@/server/queries";
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
  const staff = await getStaffUsers();
  const tA = await getTranslations("adminTickets");

  return (
    <div className="space-y-6">
      <Link href="/admin/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {t("backToList")}
      </Link>

      <PageHeader title={ticket.subject} subtitle={ticket.ref} />

      <Card>
        <CardHeader>
          <CardTitle>{tA("manage")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketAdminControls
            ticketId={ticket.id}
            currentStatus={ticket.status}
            assigneeId={ticket.assigneeId}
            staff={staff}
          />
        </CardContent>
      </Card>

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

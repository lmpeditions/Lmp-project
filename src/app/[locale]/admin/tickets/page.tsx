import { setRequestLocale, getTranslations } from "next-intl/server";
import { MessageSquare, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { demoDossier } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { ticketStatusTone } from "@/lib/status";

const assignees: Record<string, string> = {
  t1: "K. Benali",
  t2: "S. Haddadi",
  t3: "K. Benali",
};

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

  const statuses = ["open", "inProgress", "waiting", "resolved", "closed"] as const;
  const counts = statuses.map((s) => ({
    status: s,
    count: demoDossier.tickets.filter((tk) => tk.status === s).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {counts.map((c) => (
          <Card key={c.status} className="p-4">
            <p className="text-2xl font-bold">{c.count}</p>
            <Badge tone={ticketStatusTone[c.status]} className="mt-1.5">
              {tTk(c.status)}
            </Badge>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <CardTitle>{t("queue")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">{tTk("subject")}</th>
                  <th className="px-5 py-3 font-medium">{tTk("category")}</th>
                  <th className="px-5 py-3 font-medium">{t("assignee")}</th>
                  <th className="px-5 py-3 font-medium">{tTk("lastUpdate")}</th>
                  <th className="px-5 py-3 font-medium">{tTk("status")}</th>
                </tr>
              </thead>
              <tbody>
                {demoDossier.tickets.map((tk) => (
                  <tr key={tk.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3.5 font-mono text-xs">{tk.ref}</td>
                    <td className="px-5 py-3.5 font-medium">{tk.subject}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone="neutral">{tCat(tk.category)}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <UserCog className="h-3.5 w-3.5" />
                        {assignees[tk.id] ?? t("unassigned")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{formatDate(tk.updatedAt, locale)}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={ticketStatusTone[tk.status]} dot>
                        {tTk(tk.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { Megaphone, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { communicationActions } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { CommunicationStatus } from "@/lib/types";

const statusTone: Record<CommunicationStatus, BadgeTone> = {
  done: "success",
  inProgress: "info",
  planned: "primary",
  confirmed: "success",
  upcoming: "neutral",
};

export default async function CommunicationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("communication");
  const m = communicationActions;

  const sorted = [...m].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Actions table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">{t("action")}</th>
                  <th className="px-5 py-3 font-medium">{t("date")}</th>
                  <th className="px-5 py-3 font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {m.map((a) => (
                  <tr key={a.label} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3.5 font-medium">{a.label}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {a.date ? formatDate(a.date, locale) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={statusTone[a.status]} dot>
                        {t(`states.${a.status}`)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Marketing calendar */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <CardTitle>{t("calendar")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-5">
              {sorted.map((a) => (
                <li key={a.label} className="relative">
                  <span className="absolute -left-[1.42rem] flex h-3 w-3 rounded-full border-2 border-accent bg-background" />
                  <p className="text-xs text-muted-foreground">
                    {a.date ? formatDate(a.date, locale) : "—"}
                  </p>
                  <p className="text-sm font-medium">{a.label}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

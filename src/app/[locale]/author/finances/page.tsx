import { setRequestLocale, getTranslations } from "next-intl/server";
import { Wallet, CheckCircle2, Clock, AlertTriangle, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { demoDossier } from "@/lib/mock-data";
import { formatDH, formatDate } from "@/lib/utils";
import { paymentStatusTone } from "@/lib/status";

export default async function FinancesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("finances");
  const tc = await getTranslations("common");
  const d = demoDossier;

  const paid = d.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = d.contractTotal - paid;

  const summary = [
    { label: t("totalContract"), value: d.contractTotal, icon: Wallet, tone: "primary" as const },
    { label: t("totalPaid"), value: paid, icon: CheckCircle2, tone: "success" as const },
    { label: t("remaining"), value: remaining, icon: Clock, tone: "warning" as const },
  ];

  const toneClasses = {
    primary: "bg-primary/12 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <ActionButton variant="outline" successMessage={t("reportProblemSent")}>
            <AlertTriangle className="h-4 w-4" />
            {t("reportProblem")}
          </ActionButton>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {summary.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneClasses[s.tone]}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">
                  {formatDH(s.value, locale)} <span className="text-sm font-medium text-muted-foreground">{tc("currency")}</span>
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{Math.round((paid / d.contractTotal) * 100)}% {t("paid").toLowerCase()}</span>
          <span className="text-muted-foreground">
            {formatDH(paid, locale)} / {formatDH(d.contractTotal, locale)} {tc("currency")}
          </span>
        </div>
        <Progress value={(paid / d.contractTotal) * 100} className="h-3" indicatorClassName="bg-gradient-to-r from-primary to-accent" />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment history */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("paymentHistory")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">{t("date")}</th>
                    <th className="px-5 py-3 font-medium">{t("amount")}</th>
                    <th className="px-5 py-3 font-medium">{t("method")}</th>
                    <th className="px-5 py-3 font-medium">{t("reference")}</th>
                    <th className="px-5 py-3 font-medium">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.payments.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-3.5">{formatDate(p.date, locale)}</td>
                      <td className="px-5 py-3.5 font-semibold">
                        {formatDH(p.amount, locale)} {tc("currency")}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{t(`method_${p.method}`)}</td>
                      <td className="px-5 py-3.5 font-mono text-xs">{p.reference}</td>
                      <td className="px-5 py-3.5">
                        <Badge tone={paymentStatusTone[p.status]} dot>
                          {t(p.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming payments */}
        <Card>
          <CardHeader>
            <CardTitle>{t("upcomingPayments")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.schedule.map((s) => (
              <div key={s.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t("dueDate")}
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-medium">{formatDate(s.dueDate, locale)}</span>
                  <span className="text-lg font-bold text-warning">
                    {formatDH(s.amount, locale)} {tc("currency")}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

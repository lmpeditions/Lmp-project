import { setRequestLocale, getTranslations } from "next-intl/server";
import { Plus, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { adminPayments } from "@/lib/mock-data";
import { formatDH, formatDate } from "@/lib/utils";
import { paymentStatusTone } from "@/lib/status";

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminPayments");
  const tF = await getTranslations("finances");
  const tc = await getTranslations("common");

  const collected = adminPayments
    .filter((p) => p.status === "validated")
    .reduce((s, p) => s + p.amount, 0);
  const pending = adminPayments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <ActionButton successMessage={tc("demoNote")}>
            <Plus className="h-4 w-4" />
            {t("recordPayment")}
          </ActionButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/12 text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("totalCollected")}</p>
              <p className="text-xl font-bold">
                {formatDH(collected, locale)} <span className="text-sm text-muted-foreground">{tc("currency")}</span>
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning/12 text-warning">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("totalPending")}</p>
              <p className="text-xl font-bold">
                {formatDH(pending, locale)} <span className="text-sm text-muted-foreground">{tc("currency")}</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tF("paymentHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">{tF("date")}</th>
                  <th className="px-5 py-3 font-medium">{t("dossier")}</th>
                  <th className="px-5 py-3 font-medium">{t("author")}</th>
                  <th className="px-5 py-3 font-medium">{tF("amount")}</th>
                  <th className="px-5 py-3 font-medium">{tF("method")}</th>
                  <th className="px-5 py-3 font-medium">{tF("reference")}</th>
                  <th className="px-5 py-3 font-medium">{tF("status")}</th>
                  <th className="px-5 py-3 text-right font-medium">{t("validate")}</th>
                </tr>
              </thead>
              <tbody>
                {adminPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3.5">{formatDate(p.date, locale)}</td>
                    <td className="px-5 py-3.5 font-mono text-xs">{p.trackingNumber}</td>
                    <td className="px-5 py-3.5">{p.authorName}</td>
                    <td className="px-5 py-3.5 font-semibold">
                      {formatDH(p.amount, locale)} {tc("currency")}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{tF(`method_${p.method}`)}</td>
                    <td className="px-5 py-3.5 font-mono text-xs">{p.reference}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={paymentStatusTone[p.status]} dot>
                        {tF(p.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {p.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {t("validate")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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

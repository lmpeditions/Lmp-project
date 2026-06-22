import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Wallet, FileText, ArrowDownLeft, ArrowUpRight, Upload, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { UploadInvoiceForm } from "@/components/author/upload-invoice-form";
import { getCurrentUser, getActiveBook, getFinanceData } from "@/server/queries";
import { formatDH, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function FinancesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("finance");
  const tc = await getTranslations("common");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  const active = await getActiveBook(user.id);
  if (!active) redirect(`/${locale}/author/start`);
  if (active.status === "PENDING_VALIDATION") redirect(`/${locale}/author`);
  const f = await getFinanceData(active.id);
  if (!f) redirect(`/${locale}/author`);

  const methodLabel = (m: string) =>
    m === "transfer" ? t("methodTransfer") : m === "cash" ? t("methodCash") : t("methodCard");

  const summary = [
    { label: t("total"), value: f.contractTotal, tone: "" },
    { label: t("paid"), value: f.paid, tone: "text-success" },
    { label: t("balance"), value: f.balance, tone: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={`${t("subtitle")} · ${active.bookTitle}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {summary.map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-lg font-bold ${s.tone}`}>
                    {formatDH(s.value, locale)} <span className="text-xs font-normal">{tc("currency")}</span>
                  </p>
                </div>
              ))}
            </div>
            <Progress
              value={f.contractTotal ? (f.paid / f.contractTotal) * 100 : 0}
              indicatorClassName="bg-gradient-to-r from-primary to-accent"
            />
            {(f.ledgerIn > 0 || f.ledgerOut > 0) && (
              <p className="text-xs text-muted-foreground">
                {t("movements")} :{" "}
                <span className="font-medium text-success">+{formatDH(f.ledgerIn, locale)}</span> /{" "}
                <span className="font-medium text-danger">-{formatDH(f.ledgerOut, locale)}</span> {tc("currency")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            <CardTitle>{t("strategy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {f.financingStrategy ? (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{f.financingStrategy}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noStrategy")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("payments")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {f.payments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("noPayments")}</p>
          ) : (
            f.payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {formatDH(p.amount, locale)} {tc("currency")}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{methodLabel(p.method)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.date, locale)} · {p.reference}
                    {p.byAuthor ? ` · ${t("byYou")}` : ""}
                  </p>
                </div>
                {p.invoiceUrl && (
                  <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    <FileText className="h-3.5 w-3.5" /> {t("invoice")}
                  </a>
                )}
                <Badge tone={p.status === "validated" ? "success" : "warning"}>
                  {p.status === "validated" ? t("validated") : t("pendingConfirm")}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {f.ledger.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("ledger")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {f.ledger.map((e) => {
              const isIn = e.direction === "IN";
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isIn ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                    {isIn ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(e.date, locale)}</p>
                  </div>
                  <p className={`text-sm font-semibold ${isIn ? "text-success" : "text-danger"}`}>
                    {isIn ? "+" : "-"}{formatDH(e.amount, locale)} {tc("currency")}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          <div>
            <CardTitle>{t("uploadTitle")}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("uploadHint")}</p>
          </div>
        </CardHeader>
        <CardContent>
          <UploadInvoiceForm dossierId={f.dossierId} />
        </CardContent>
      </Card>
    </div>
  );
}

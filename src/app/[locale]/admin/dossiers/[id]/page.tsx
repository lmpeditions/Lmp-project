import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { SlidersHorizontal, BookOpenCheck, MessageSquareText, BadgeCheck, Wallet, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ReviewManager } from "@/components/admin/review-manager";
import { RemarkForm } from "@/components/admin/remark-form";
import { RemarksList } from "@/components/author/remarks-list";
import { StageThread } from "@/components/shared/stage-thread";
import { CreateValidationForm } from "@/components/admin/create-validation-form";
import { ValidationAdminList } from "@/components/admin/validation-admin-list";
import { FinanceManager } from "@/components/admin/finance-manager";
import { confirmPaymentAction } from "@/server/finance-actions";
import { getReviewData, getDossierValidations, getFinanceData, getStageMessages } from "@/server/queries";
import { formatDH, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function AdminDossierDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("review");

  // Fetch all independent data in parallel (was 5 sequential round-trips).
  const [r, validations, finance, layoutMessages, communicationMessages, tv, tf, tc, tComm, tLayout] =
    await Promise.all([
      getReviewData(id),
      getDossierValidations(id),
      getFinanceData(id),
      getStageMessages(id, "LAYOUT"),
      getStageMessages(id, "COMMUNICATION"),
      getTranslations("validation"),
      getTranslations("finance"),
      getTranslations("common"),
      getTranslations("communication"),
      getTranslations("miseEnPage"),
    ]);
  if (!r) notFound();
  const pendingPayments = finance?.payments.filter((p) => p.status === "pending") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={r.bookTitle} subtitle={`${r.authorName} · ${r.trackingNumber}`} />

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <CardTitle>{tf("adminTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {pendingPayments.length > 0 && (
            <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/[0.04] p-3">
              <p className="text-sm font-semibold text-warning">{tf("toConfirm")} ({pendingPayments.length})</p>
              {pendingPayments.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{formatDH(p.amount, locale)} {tc("currency")} · {p.reference}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.date, locale)} · {tf("methodCash")}</p>
                  </div>
                  {p.invoiceUrl && (
                    <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">
                      {tf("invoice")}
                    </a>
                  )}
                  <form action={confirmPaymentAction}>
                    <input type="hidden" name="paymentId" value={p.id} />
                    <button type="submit" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {tf("confirm")}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
          <FinanceManager dossierId={r.dossierId} financingStrategy={finance?.financingStrategy ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-primary" />
          <CardTitle>{tv("adminTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <CreateValidationForm dossierId={r.dossierId} />
          <ValidationAdminList validations={validations} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <CardTitle>{t("manageTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewManager
            dossierId={r.dossierId}
            isbn={r.isbn ?? ""}
            legalDeposit={r.legalDeposit ?? ""}
            relectureProgress={r.relecture.progress}
            correctionProgress={r.correction.progress}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-primary" />
          <CardTitle>{t("remarksTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <RemarkForm dossierId={r.dossierId} />
          <RemarksList remarks={r.remarks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-primary" />
          <CardTitle>{t("threadTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StageThread messages={r.messages} dossierId={r.dossierId} perspective="lmp" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-primary" />
          <CardTitle>{tLayout("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StageThread messages={layoutMessages} dossierId={r.dossierId} perspective="lmp" stage="LAYOUT" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-primary" />
          <CardTitle>{tComm("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StageThread messages={communicationMessages} dossierId={r.dossierId} perspective="lmp" stage="COMMUNICATION" />
        </CardContent>
      </Card>
    </div>
  );
}

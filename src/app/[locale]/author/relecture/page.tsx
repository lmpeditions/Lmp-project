import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Hash, Stamp, MessageSquareText, BookOpenCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { RemarksList } from "@/components/author/remarks-list";
import { StageThread } from "@/components/shared/stage-thread";
import { getCurrentUser, getActiveBook, getReviewData } from "@/server/queries";

export default async function RelecturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("review");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  const active = await getActiveBook(user.id);
  if (!active) redirect(`/${locale}/author/start`);
  if (active.status === "PENDING_VALIDATION") redirect(`/${locale}/author`);
  const r = await getReviewData(active.id);
  if (!r) redirect(`/${locale}/author`);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={`${t("subtitle")} · ${r.bookTitle}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("progressTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {([
              [t("relecture"), r.relecture.progress, "from-info to-primary"],
              [t("correction"), r.correction.progress, "from-primary to-accent"],
            ] as const).map(([label, value, grad]) => (
              <div key={label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground">{value}%</span>
                </div>
                <Progress value={value} className="h-2.5" indicatorClassName={`bg-gradient-to-r ${grad}`} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("references")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {([
              [Hash, t("isbnLabel"), r.isbn],
              [Stamp, t("legalDepositLabel"), r.legalDeposit],
            ] as const).map(([Icon, label, value]) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-[1.05rem] w-[1.05rem]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`mt-0.5 text-sm font-semibold ${value ? "font-mono" : "text-muted-foreground"}`}>
                    {value || t("notYet")}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-primary" />
          <CardTitle>{t("remarksTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RemarksList remarks={r.remarks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-primary" />
          <div>
            <CardTitle>{t("threadTitle")}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("threadSubtitle")}</p>
          </div>
        </CardHeader>
        <CardContent>
          <StageThread messages={r.messages} dossierId={r.dossierId} perspective="author" />
        </CardContent>
      </Card>
    </div>
  );
}

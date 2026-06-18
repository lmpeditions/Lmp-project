import { setRequestLocale, getTranslations } from "next-intl/server";
import { LayoutTemplate, FileText, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusStepper, type StepState } from "@/components/shared/status-stepper";
import { ActionButton } from "@/components/shared/action-button";
import { miseEnPageModule } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default async function MiseEnPagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("miseEnPage");
  const tc = await getTranslations("common");
  const m = miseEnPageModule;

  const steps = m.steps.map((s) => ({
    label: t(`steps.${s.key}`),
    state: (s.status === "done"
      ? "done"
      : s.status === "inProgress"
        ? "current"
        : "upcoming") as StepState,
  }));

  const batReady = m.steps.some((s) => s.key === "bat" && s.status !== "upcoming");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusStepper steps={steps} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("documents")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {m.documents.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(doc.date, locale)} · {doc.size}
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label={tc("download")}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* BAT validation */}
        <Card className="border-accent/30 bg-accent/[0.04]">
          <CardHeader className="flex-row items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <CardTitle>{t("steps.bat")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {m.batValidated ? (
              <p className="flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 className="h-4 w-4" /> {t("batValidated")}
              </p>
            ) : batReady ? (
              <ActionButton
                variant="accent"
                successMessage={t("batValidated")}
                confirmMessage={t("batConfirm")}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("validateBat")}
              </ActionButton>
            ) : (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {t("batPending")}
              </p>
            )}
            <div className="flex h-28 items-center justify-center rounded-lg bg-gradient-to-br from-muted to-muted/40 text-muted-foreground">
              <LayoutTemplate className="h-10 w-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

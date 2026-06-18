import { setRequestLocale, getTranslations } from "next-intl/server";
import { FileX, AlertTriangle, FileCheck2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusStepper, type StepState } from "@/components/shared/status-stepper";
import { ActionButton } from "@/components/shared/action-button";
import { terminationModule } from "@/lib/mock-data";

export default async function ResiliationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("resiliation");
  const m = terminationModule;

  const steps = m.steps.map((s, i) => ({
    label: t(`steps.${s.key}`),
    state: (s.done ? "done" : i === 0 && m.status === "notStarted" ? "upcoming" : "upcoming") as StepState,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Consequences warning */}
      <Card className="border-danger/30 bg-danger/[0.04]">
        <CardHeader className="flex-row items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-danger" />
          <CardTitle>{t("consequencesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("consequences")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{t("worksDone")}</p>
              <p className="mt-1 text-sm font-medium">ISBN · Relecture · Correction (40%)</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{t("possibleFees")}</p>
              <p className="mt-1 text-sm font-medium">Selon conditions contractuelles</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process */}
      <Card>
        <CardHeader>
          <CardTitle>{t("process")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusStepper steps={steps} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileCheck2 className="h-4 w-4" />
            <FileX className="h-4 w-4" />
          </div>
          <ActionButton
            variant="danger"
            successMessage={t("requestSent")}
            confirmMessage={t("confirm")}
          >
            <FileX className="h-4 w-4" />
            {t("requestButton")}
          </ActionButton>
        </CardContent>
      </Card>
    </div>
  );
}

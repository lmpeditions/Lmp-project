import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusStepper, type StepState } from "@/components/shared/status-stepper";
import { TerminationForm } from "@/components/author/termination-form";
import { getCurrentUser, getActiveBook, getTermination } from "@/server/queries";

const STEP_KEYS = ["submission", "review", "decision", "closure"] as const;
const STATUS_INDEX: Record<string, number> = { notStarted: -1, submitted: 0, review: 1, decision: 2, closed: 3 };

export const dynamic = "force-dynamic";
export default async function ResiliationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("resiliation");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  const active = await getActiveBook(user.id);
  if (!active) redirect(`/${locale}/author/start`);
  if (active.status === "PENDING_VALIDATION") redirect(`/${locale}/author`);

  const term = await getTermination(active.id);
  const idx = STATUS_INDEX[term.status] ?? -1;
  const steps = STEP_KEYS.map((k, i) => ({
    label: t(`steps.${k}`),
    state: (i <= idx ? "done" : i === idx + 1 ? "current" : "upcoming") as StepState,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={`${t("subtitle")} · ${active.bookTitle}`} />

      <Card className="border-danger/30 bg-danger/[0.04]">
        <CardHeader className="flex-row items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-danger" />
          <CardTitle>{t("consequencesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("consequences")}</p>
        </CardContent>
      </Card>

      {term.exists && (
        <Card>
          <CardHeader>
            <CardTitle>{t("process")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusStepper steps={steps} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <CardTitle>{t("requestButton")}</CardTitle>
        </CardHeader>
        <CardContent>
          {term.exists ? (
            <p className="text-sm text-muted-foreground">{t("alreadyRequested")}</p>
          ) : (
            <TerminationForm dossierId={active.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

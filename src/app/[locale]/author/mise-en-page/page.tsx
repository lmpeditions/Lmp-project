import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { LayoutTemplate, MessageSquareText, CheckCircle2, Gavel } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ValidationCard } from "@/components/author/validation-card";
import { StageThread } from "@/components/shared/stage-thread";
import {
  getCurrentUser,
  getActiveBook,
  getDossierValidations,
  getStageMessages,
  type ValidationView,
} from "@/server/queries";

export const dynamic = "force-dynamic";
export default async function MiseEnPagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("miseEnPage");
  const tv = await getTranslations("validation");
  const tr = await getTranslations("review");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  const active = await getActiveBook(user.id);
  if (!active) redirect(`/${locale}/author/start`);
  if (active.status === "PENDING_VALIDATION") redirect(`/${locale}/author`);

  const layouts = (await getDossierValidations(active.id)).filter((v) => v.kind === "LAYOUT");
  const pending = layouts.filter((v) => v.status === "PENDING" && !v.expired);
  const past = layouts.filter((v) => !(v.status === "PENDING" && !v.expired));
  const messages = await getStageMessages(active.id, "LAYOUT");

  const badge = (v: ValidationView): { tone: BadgeTone; label: string } => {
    if (v.status === "VALIDATED") return { tone: "success", label: tv("statusValidated") };
    if (v.status === "CHANGES_REQUESTED") return { tone: "warning", label: tv("statusChanges") };
    if (v.status === "EXPIRED_TO_EDITOR") return { tone: "info", label: tv("statusEditor") };
    return { tone: "warning", label: tv("expiredLabel") };
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={`${t("subtitle")} · ${active.bookTitle}`} />

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-accent" />
          <CardTitle>{tv("pendingTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pending.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{tv("noPending")}</p>
          ) : (
            pending.map((v) => <ValidationCard key={v.id} v={v} />)
          )}
          {past.map((v) => {
            const b = badge(v);
            const chosen = v.options.find((o) => o.id === v.selectedOptionId);
            return (
              <div key={v.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{v.title}</span>
                  <Badge tone={b.tone}>{b.label}</Badge>
                </div>
                {chosen && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    {v.status === "EXPIRED_TO_EDITOR" ? <Gavel className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                    {tv("chosen")}: <span className="font-medium text-foreground">{chosen.label}</span>
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-primary" />
          <div>
            <CardTitle>{tr("threadTitle")}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </CardHeader>
        <CardContent>
          <StageThread messages={messages} dossierId={active.id} perspective="author" stage="LAYOUT" />
        </CardContent>
      </Card>
    </div>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { BookOpen, FileText, Download, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatusStepper, type StepState } from "@/components/shared/status-stepper";
import { relectureModule } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

const STATE_ORDER = [
  "notStarted",
  "firstRead",
  "commentsSent",
  "authorValidation",
  "done",
] as const;

export default async function RelecturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("relecture");
  const tc = await getTranslations("common");
  const m = relectureModule;

  const currentIndex = STATE_ORDER.indexOf(m.state);
  const steps = STATE_ORDER.map((s, i) => ({
    label: t(`state.${s}`),
    state: (i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming") as StepState,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("states")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <StatusStepper steps={steps} />
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">{t("progress")}</span>
              <span className="text-muted-foreground">{m.progress}%</span>
            </div>
            <Progress
              value={m.progress}
              className="h-3"
              indicatorClassName="bg-gradient-to-r from-info to-primary"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary" />
            <CardTitle>{t("editorNotes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {m.notes.map((note, i) => (
                <li key={i} className="flex gap-3 rounded-lg border border-border p-3 text-sm">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sharedFiles")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {m.files.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(f.date, locale)} · {f.size}
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label={tc("download")}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

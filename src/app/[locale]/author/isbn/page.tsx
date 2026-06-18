import { setRequestLocale, getTranslations } from "next-intl/server";
import { Stamp, FileText, Download, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusStepper, type StepState } from "@/components/shared/status-stepper";
import { isbnModule } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

const STATUS_ORDER = ["notStarted", "requestSent", "pending", "obtained"] as const;

export default async function IsbnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("isbn");
  const tc = await getTranslations("common");
  const m = isbnModule;

  const currentIndex = STATUS_ORDER.indexOf(m.status);
  const steps = STATUS_ORDER.map((s, i) => ({
    label: t(`status.${s}`),
    state: (i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming") as StepState,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("currentStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <StatusStepper steps={steps} />
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-success/30 bg-success/[0.05] p-4">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">{t("isbnNumber")}</p>
                <p className="font-mono text-lg font-bold">{m.isbn}</p>
              </div>
              <Badge tone="success" dot className="ml-auto">
                {t(`status.${m.status}`)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center">
          <CardContent className="flex flex-col items-center pt-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Stamp className="h-8 w-8" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t("subtitle")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Associated documents */}
        <Card>
          <CardHeader>
            <CardTitle>{t("associatedDocuments")}</CardTitle>
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

        {/* Action history */}
        <Card>
          <CardHeader>
            <CardTitle>{t("actionHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-5">
              {m.history.map((h) => (
                <li key={h.date} className="relative">
                  <span className="absolute -left-[1.42rem] flex h-3 w-3 items-center justify-center rounded-full border-2 border-primary bg-background" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(h.date, locale)}
                  </div>
                  <p className="text-sm font-medium">{h.label}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

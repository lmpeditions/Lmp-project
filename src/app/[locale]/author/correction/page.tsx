import { setRequestLocale, getTranslations } from "next-intl/server";
import { SpellCheck, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { ProgressGauge } from "@/components/author/progress-gauge";
import { correctionModule } from "@/lib/mock-data";

export default async function CorrectionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("correction");
  const m = correctionModule;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center text-center">
          <CardHeader className="items-center pb-0">
            <CardTitle>{t("globalProgress")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <ProgressGauge value={m.progress} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center gap-2">
            <SpellCheck className="h-4 w-4 text-primary" />
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {m.substeps.map((s) => (
              <div key={s.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{t(`substeps.${s.key}`)}</span>
                  <span className="text-muted-foreground">{s.progress}%</span>
                </div>
                <Progress
                  value={s.progress}
                  indicatorClassName={
                    s.progress === 100
                      ? "bg-success"
                      : s.progress > 0
                        ? "bg-gradient-to-r from-primary to-accent"
                        : ""
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-primary" />
          <CardTitle>{t("remarks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {m.remarks.map((r, i) => (
              <li key={i} className="rounded-lg border border-border p-3 text-sm">
                {r}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

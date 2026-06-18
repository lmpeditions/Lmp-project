import { setRequestLocale, getTranslations } from "next-intl/server";
import { Percent, Gauge, Users, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ActionButton } from "@/components/shared/action-button";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { StageChart } from "@/components/charts/stage-chart";
import { adminStats } from "@/lib/mock-data";

export default async function AdminStatisticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminStats");
  const tAdmin = await getTranslations("admin");
  const tc = await getTranslations("common");
  const s = adminStats;

  const completionRate = Math.round((s.completed / s.totalProjects) * 100);
  const avgProgress = Math.round(
    s.dossiers.reduce((sum, d) => sum + d.progress, 0) / s.dossiers.length
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <ActionButton variant="outline" successMessage={tc("demoNote")}>
            <Download className="h-4 w-4" />
            {t("export")}
          </ActionButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("completionRate")} value={`${completionRate}%`} icon={Percent} tone="success" />
        <StatCard label={t("avgProgress")} value={`${avgProgress}%`} icon={Gauge} tone="primary" />
        <StatCard label={t("activeAuthors")} value={String(s.totalClients)} icon={Users} tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{tAdmin("revenueByMonth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart
              data={s.revenueByMonth}
              labels={{ collected: tAdmin("revenue"), pending: tAdmin("pendingRevenue") }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{tAdmin("projectsByStage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StageChart data={s.stageDistribution} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

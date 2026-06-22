import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  Users,
  FolderKanban,
  Loader,
  CheckCircle2,
  TrendingUp,
  Clock,
  Activity,
  Sparkles,
  CreditCard,
  Ticket as TicketIcon,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { StageChart } from "@/components/charts/stage-chart";
import { getAdminStats } from "@/server/queries";
import { formatDH, formatDate } from "@/lib/utils";
import { adminDossierStatusTone } from "@/lib/status";

const activityIcons = {
  stage: Sparkles,
  document: FileText,
  payment: CreditCard,
  ticket: TicketIcon,
  cover: ImageIcon,
} as const;

export const dynamic = "force-dynamic";
export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const tc = await getTranslations("common");
  const s = await getAdminStats();

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("totalClients")}
          value={String(s.totalClients)}
          icon={Users}
          tone="primary"
          hint={t("newThisMonth", { count: s.clientsNewThisMonth })}
        />
        <StatCard label={t("inProgress")} value={String(s.inProgress)} icon={Loader} tone="info" />
        <StatCard label={t("completed")} value={String(s.completed)} icon={CheckCircle2} tone="success" />
        <StatCard
          label={t("revenue")}
          value={`${formatDH(s.revenueCollected, locale)} ${tc("currency")}`}
          icon={TrendingUp}
          tone="accent"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("revenueByMonth")}</CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                {t("revenue")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
                {t("pendingRevenue")}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart
              data={s.revenueByMonth}
              labels={{ collected: t("revenue"), pending: t("pendingRevenue") }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("projectsByStage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StageChart data={s.stageDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* Pending revenue banner + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col justify-center gap-2 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {t("pendingRevenue")}
          </div>
          <p className="text-3xl font-bold text-accent">
            {formatDH(s.revenuePending, locale)} <span className="text-base text-muted-foreground">{tc("currency")}</span>
          </p>
          <Progress
            value={s.revenueCollected + s.revenuePending > 0 ? (s.revenueCollected / (s.revenueCollected + s.revenuePending)) * 100 : 0}
            indicatorClassName="bg-gradient-to-r from-primary to-accent"
          />
          <p className="text-xs text-muted-foreground">
            {formatDH(s.revenueCollected, locale)} {tc("currency")} {t("revenue").toLowerCase()}
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <CardTitle>{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {s.recentActivity.map((item) => {
                const Icon = activityIcons[item.type];
                return (
                  <li key={item.id} className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm">{item.label}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.date, locale)}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Dossiers table */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <FolderKanban className="h-4 w-4 text-primary" />
          <CardTitle>{t("dossiersList")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">{t("author")}</th>
                  <th className="px-5 py-3 font-medium">{t("book")}</th>
                  <th className="px-5 py-3 font-medium">{t("editor")}</th>
                  <th className="px-5 py-3 font-medium">{t("progress")}</th>
                  <th className="px-5 py-3 font-medium">{t("status")}</th>
                  <th className="px-5 py-3 font-medium">{t("openTickets")}</th>
                </tr>
              </thead>
              <tbody>
                {s.dossiers.map((row) => (
                  <tr key={row.trackingNumber} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3.5 font-mono text-xs">{row.trackingNumber}</td>
                    <td className="px-5 py-3.5 font-medium">{row.authorName}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.bookTitle}</td>
                    <td className="px-5 py-3.5">{row.editor}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Progress value={row.progress} className="h-1.5 w-24" />
                        <span className="text-xs text-muted-foreground">{row.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={adminDossierStatusTone[row.status]} dot>
                        {t(row.status === "onHold" ? "inProgress" : row.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {row.openTickets > 0 ? (
                        <Badge tone="warning">{row.openTickets}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

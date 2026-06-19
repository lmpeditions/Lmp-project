import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  Hash,
  BookText,
  User,
  CalendarDays,
  UserCog,
  Sparkles,
  CalendarCheck,
  Wallet,
  Image as ImageIcon,
  Ticket as TicketIcon,
  FileText,
  CreditCard,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { ProgressGauge } from "@/components/author/progress-gauge";
import { StageTimeline } from "@/components/author/stage-timeline";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { getCurrentUser, getAuthorDashboard } from "@/server/queries";
import { formatDH, formatDate } from "@/lib/utils";

const activityIcons = {
  stage: Sparkles,
  document: FileText,
  payment: CreditCard,
  ticket: TicketIcon,
  cover: ImageIcon,
} as const;

export default async function AuthorDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const tc = await getTranslations("common");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  const d = await getAuthorDashboard(user.id);

  if (!d) {
    return (
      <div className="space-y-6">
        <PageHeader title={`${t("welcome")}, ${user.name.split(" ")[0]} 👋`} subtitle={t("welcomeSub")} />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {locale === "fr"
              ? "Aucun livre n'est encore associé à votre compte."
              : "No book is linked to your account yet."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const paid = d.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = d.contractTotal - paid;
  const firstName = d.authorName.split(" ")[0];

  const info = [
    { icon: Hash, label: t("trackingNumber"), value: d.trackingNumber, mono: true },
    { icon: BookText, label: t("bookTitle"), value: d.bookTitle },
    { icon: User, label: t("authorName"), value: d.authorName },
    { icon: CalendarDays, label: t("startDate"), value: formatDate(d.startDate, locale) },
    { icon: UserCog, label: t("editor"), value: d.editor },
    { icon: Sparkles, label: t("formula"), value: d.formula },
    { icon: CalendarCheck, label: t("estimatedPublication"), value: formatDate(d.estimatedPublication, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={`${t("welcome")}, ${firstName} 👋`} subtitle={t("welcomeSub")} />

      {/* Top: general info + global progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("generalInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {info.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <item.icon className="h-[1.05rem] w-[1.05rem]" />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{item.label}</dt>
                    <dd className={`mt-0.5 truncate text-sm font-semibold ${item.mono ? "font-mono" : ""}`}>
                      {item.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center">
          <CardHeader className="items-center pb-0">
            <CardTitle>{t("globalProgress")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <ProgressGauge value={d.globalProgress} />
            <p className="mt-4 text-sm text-muted-foreground">
              {t("projectCompleted", { percent: d.globalProgress })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t("timeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StageTimeline stages={d.stages} />
        </CardContent>
      </Card>

      {/* Bottom: finances + activity + deadlines */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Financial summary */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("financialSummary")}</CardTitle>
            <Link href="/author/finances" className="text-muted-foreground hover:text-primary">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tc("currency")} — total</p>
                <p className="text-lg font-bold">
                  {formatDH(d.contractTotal, locale)} {tc("currency")}
                </p>
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{formatDH(paid, locale)} {tc("currency")} payé</span>
                <span className="font-medium text-warning">
                  {formatDH(remaining, locale)} {tc("currency")} restant
                </span>
              </div>
              <Progress value={(paid / d.contractTotal) * 100} indicatorClassName="bg-gradient-to-r from-primary to-accent" />
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <CardTitle>{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {d.activity.map((item) => {
                const Icon = activityIcons[item.type];
                return (
                  <li key={item.id} className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm">{item.label}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(item.date, locale)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Action required + deadlines */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-accent/30 bg-accent/[0.04]">
          <CardHeader className="flex-row items-center gap-2">
            <ImageIcon className="h-4 w-4 text-accent" />
            <CardTitle>{t("actionRequired")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {locale === "fr"
                ? "Une nouvelle maquette de couverture attend votre validation."
                : "A new cover mockup is awaiting your approval."}
            </p>
            <Link
              href="/author/couverture"
              className="shrink-0 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground hover:opacity-90"
            >
              {tc("view")}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nextDeadlines")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {d.schedule.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(s.dueDate, locale)}</span>
                  </div>
                  <Badge tone="warning">{formatDH(s.amount, locale)} {tc("currency")}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

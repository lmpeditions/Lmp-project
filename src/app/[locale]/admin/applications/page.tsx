import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ApplicationReview } from "@/components/admin/application-review";
import { getPendingApplications } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminApplications");

  const applications = await getPendingApplications();

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          <CardTitle>
            {t("pending")} ({applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {applications.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("none")}</p>
          ) : (
            applications.map((a) => <ApplicationReview key={a.id} app={a} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

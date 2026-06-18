import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationList } from "@/components/author/notification-list";
import { notificationsList } from "@/lib/mock-data";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("notifications");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <NotificationList items={notificationsList} locale={locale} />
    </div>
  );
}

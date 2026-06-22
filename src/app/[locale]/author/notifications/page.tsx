import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationList } from "@/components/author/notification-list";
import { getCurrentUser, getAuthorNotifications } from "@/server/queries";

export const dynamic = "force-dynamic";
export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("notifications");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  const items = await getAuthorNotifications(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <NotificationList items={items} locale={locale} />
    </div>
  );
}

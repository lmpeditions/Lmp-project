import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { UserTable } from "@/components/admin/user-table";
import { adminUsers } from "@/lib/mock-data";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminUsers");
  const tc = await getTranslations("common");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <ActionButton successMessage={tc("demoNote")}>
            <UserPlus className="h-4 w-4" />
            {t("newUser")}
          </ActionButton>
        }
      />
      <UserTable users={adminUsers} />
    </div>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CreateAdminForm } from "@/components/admin/create-admin-form";
import { getSession } from "@/server/auth";
import { can } from "@/server/rbac";

export const dynamic = "force-dynamic";
export default async function NewAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Only users who can manage users may reach this screen.
  const session = await getSession();
  if (!session || !can(session.role, "user.manage")) redirect(`/${locale}/admin`);

  const t = await getTranslations("adminCreate");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <CreateAdminForm />
    </div>
  );
}

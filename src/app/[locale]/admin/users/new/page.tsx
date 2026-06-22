import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { CreateAuthorForm } from "@/components/admin/create-author-form";

export const dynamic = "force-dynamic";
export default async function NewAuthorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("crm");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("newAuthorTitle")} subtitle={t("newAuthorSubtitle")} />
      <CreateAuthorForm />
    </div>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { DossierTable } from "@/components/admin/dossier-table";
import { adminStats } from "@/lib/mock-data";

export default async function AdminDossiersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminDossiers");
  const tc = await getTranslations("common");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <ActionButton successMessage={tc("demoNote")}>
            <Plus className="h-4 w-4" />
            {t("newDossier")}
          </ActionButton>
        }
      />
      <DossierTable rows={adminStats.dossiers} />
    </div>
  );
}

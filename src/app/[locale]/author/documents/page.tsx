import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentLibrary } from "@/components/author/document-library";
import { documentsLibrary } from "@/lib/mock-data";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("documents");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <DocumentLibrary documents={documentsLibrary} locale={locale} />
    </div>
  );
}

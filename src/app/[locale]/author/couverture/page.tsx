import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { CoverGallery } from "@/components/author/cover-gallery";
import { demoDossier } from "@/lib/mock-data";

export default async function CouverturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("couverture");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <CoverGallery proposals={demoDossier.coverProposals} bookTitle={demoDossier.bookTitle} />
    </div>
  );
}

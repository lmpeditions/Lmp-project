import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StartBookForm } from "@/components/author/start-book-form";

export default async function StartBookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("books");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("startTitle")} subtitle={t("startSubtitle")} />
      <Card>
        <CardContent className="pt-6">
          <StartBookForm />
        </CardContent>
      </Card>
    </div>
  );
}

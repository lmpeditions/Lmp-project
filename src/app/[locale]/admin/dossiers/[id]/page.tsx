import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { SlidersHorizontal, BookOpenCheck, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ReviewManager } from "@/components/admin/review-manager";
import { RemarkForm } from "@/components/admin/remark-form";
import { RemarksList } from "@/components/author/remarks-list";
import { StageThread } from "@/components/shared/stage-thread";
import { getReviewData } from "@/server/queries";

export default async function AdminDossierDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("review");

  const r = await getReviewData(id);
  if (!r) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={r.bookTitle} subtitle={`${r.authorName} · ${r.trackingNumber}`} />

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <CardTitle>{t("manageTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewManager
            dossierId={r.dossierId}
            isbn={r.isbn ?? ""}
            legalDeposit={r.legalDeposit ?? ""}
            relectureProgress={r.relecture.progress}
            correctionProgress={r.correction.progress}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-primary" />
          <CardTitle>{t("remarksTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <RemarkForm dossierId={r.dossierId} />
          <RemarksList remarks={r.remarks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-primary" />
          <CardTitle>{t("threadTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StageThread messages={r.messages} dossierId={r.dossierId} perspective="lmp" />
        </CardContent>
      </Card>
    </div>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StageThread } from "@/components/shared/stage-thread";
import { getCurrentUser, getActiveBook, getStageMessages } from "@/server/queries";

export const dynamic = "force-dynamic";
export default async function CommunicationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("communication");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  const active = await getActiveBook(user.id);
  if (!active) redirect(`/${locale}/author/start`);
  if (active.status === "PENDING_VALIDATION") redirect(`/${locale}/author`);

  const messages = await getStageMessages(active.id, "COMMUNICATION");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={`${t("subtitle")} · ${active.bookTitle}`} />
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StageThread messages={messages} dossierId={active.id} perspective="author" stage="COMMUNICATION" />
        </CardContent>
      </Card>
    </div>
  );
}

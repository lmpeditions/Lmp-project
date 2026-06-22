import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { CreateTicketForm } from "@/components/author/create-ticket-form";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";
export default async function NewTicketPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tickets");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/author/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {t("backToList")}
      </Link>

      <PageHeader title={t("createTitle")} subtitle={t("subtitle")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("createTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTicketForm />
        </CardContent>
      </Card>
    </div>
  );
}

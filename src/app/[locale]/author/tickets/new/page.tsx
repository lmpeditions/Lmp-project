import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { TicketComposer } from "@/components/author/ticket-composer";
import { Link } from "@/i18n/routing";

const CATEGORIES = [
  "general",
  "complaint",
  "finance",
  "proofreading",
  "cover",
  "communication",
  "technical",
  "termination",
] as const;

export default async function NewTicketPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tickets");
  const tCat = await getTranslations("tickets.categories");

  const inputClass =
    "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

  return (
    <div className="space-y-6">
      <Link
        href="/author/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToList")}
      </Link>

      <PageHeader title={t("createTitle")} subtitle={t("subtitle")} />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("createTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("category")}</label>
            <select className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {tCat(c)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("createSubject")}</label>
            <input type="text" className={inputClass} placeholder={t("createSubject")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("createMessage")}</label>
            <TicketComposer submitLabel={t("submit")} successMessage={t("createTitle")} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

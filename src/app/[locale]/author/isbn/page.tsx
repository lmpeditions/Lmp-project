import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Stamp, Hash, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUser, getActiveBook, getIsbnInfo } from "@/server/queries";
import { stageStatusTone } from "@/lib/status";

export const dynamic = "force-dynamic";
export default async function IsbnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("isbn");
  const tr = await getTranslations("review");
  const tStatus = await getTranslations("stages.status");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  const active = await getActiveBook(user.id);
  if (!active) redirect(`/${locale}/author/start`);
  if (active.status === "PENDING_VALIDATION") redirect(`/${locale}/author`);

  const info = await getIsbnInfo(active.id);
  if (!info) redirect(`/${locale}/author`);

  const rows = [
    { icon: Hash, label: tr("isbnLabel"), value: info.isbn },
    { icon: Stamp, label: tr("legalDepositLabel"), value: info.legalDeposit },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={`${t("subtitle")} · ${active.bookTitle}`} />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t("currentStatus")}</CardTitle>
          <Badge tone={stageStatusTone[info.isbnStatus]} dot>
            {tStatus(info.isbnStatus)}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3 rounded-lg border border-border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <r.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className={`mt-0.5 text-lg font-bold ${r.value ? "font-mono" : "text-sm font-normal text-muted-foreground"}`}>
                  {r.value || tr("notYet")}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 py-5 text-sm text-muted-foreground">
          <FileCheck className="h-5 w-5 shrink-0 text-primary" />
          {t("subtitle")}
        </CardContent>
      </Card>
    </div>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Upload, FileText, ShieldCheck, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { AuthorDocumentForm } from "@/components/author/author-document-form";
import { getCurrentUser, getActiveBook, getAuthorDocuments } from "@/server/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("documents");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  const active = await getActiveBook(user.id);
  if (!active) redirect(`/${locale}/author/start`);
  if (active.status === "PENDING_VALIDATION") redirect(`/${locale}/author`);

  const docs = await getAuthorDocuments(active.id, user.id);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={`${t("subtitle")} · ${active.bookTitle}`} />

      <Card className="border-info/30 bg-info/[0.04]">
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <ShieldCheck className="h-5 w-5 shrink-0 text-info" />
          {t("internalNote")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          <div>
            <CardTitle>{t("uploadTitle")}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("uploadHint")}</p>
          </div>
        </CardHeader>
        <CardContent>
          <AuthorDocumentForm dossierId={active.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("yourDocuments")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {docs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("noDocuments")}</p>
          ) : (
            docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(d.date, locale)}</p>
                </div>
                <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> {t("open")}
                </a>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

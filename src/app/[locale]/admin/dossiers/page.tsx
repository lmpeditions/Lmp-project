import { setRequestLocale, getTranslations } from "next-intl/server";
import { Plus, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { DossierTable } from "@/components/admin/dossier-table";
import { PendingBooks } from "@/components/admin/pending-books";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/routing";
import { prisma } from "@/server/prisma";
import { getAdminDossiers } from "@/server/queries";
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

  const pending = await prisma.dossier.findMany({
    where: { status: "PENDING_VALIDATION" },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });
  const pendingRows = pending.map((d) => ({
    id: d.id,
    trackingNumber: d.trackingNumber,
    bookTitle: d.bookTitle,
    authorName: d.author.name,
    description: d.description,
    createdAt: d.createdAt.toISOString(),
  }));

  const dossiers = await getAdminDossiers();

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
      <PendingBooks rows={pendingRows} locale={locale} />

      {dossiers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("manageTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dossiers.map((d) => (
              <Link
                key={d.id}
                href={`/admin/dossiers/${d.id}`}
                className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.bookTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.authorName} · <span className="font-mono">{d.trackingNumber}</span>
                  </p>
                </div>
                <div className="hidden w-40 sm:block">
                  <Progress value={d.progress} className="h-2" />
                </div>
                <span className="w-10 text-right text-xs text-muted-foreground">{d.progress}%</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <DossierTable rows={adminStats.dossiers} />
    </div>
  );
}

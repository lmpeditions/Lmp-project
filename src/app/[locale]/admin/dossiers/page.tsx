import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DossierTable } from "@/components/admin/dossier-table";
import { PendingBooks } from "@/components/admin/pending-books";
import { Link } from "@/i18n/routing";
import { prisma } from "@/server/prisma";
import { getAdminDossierRows } from "@/server/queries";

export const dynamic = "force-dynamic";
export default async function AdminDossiersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminDossiers");

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

  const dossiers = await getAdminDossierRows();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Link
            href="/admin/users/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.99]"
          >
            <UserPlus className="h-4 w-4" />
            {t("newDossier")}
          </Link>
        }
      />
      <PendingBooks rows={pendingRows} locale={locale} />
      <DossierTable rows={dossiers} />
    </div>
  );
}

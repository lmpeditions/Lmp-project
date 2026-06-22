import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { UserTable } from "@/components/admin/user-table";
import { Link } from "@/i18n/routing";
import { prisma } from "@/server/prisma";
import type { AdminUser, UserRole, UserStatus } from "@/lib/types";

const roleMap: Record<string, UserRole> = {
  SUPER_ADMIN: "superAdmin",
  ADMIN: "admin",
  MANAGER: "manager",
  AUTHOR: "author",
};

const statusMap: Record<string, UserStatus> = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  INVITED: "invited",
};

export const dynamic = "force-dynamic";
export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminUsers");

  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { ownedDossiers: true } } },
  });

  const users: AdminUser[] = rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: roleMap[u.role],
    status: statusMap[u.status],
    dossierCount: u._count.ownedDossiers,
    lastActive: u.lastActiveAt ? u.lastActiveAt.toISOString() : "—",
  }));

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
            {t("newUser")}
          </Link>
        }
      />
      <UserTable users={users} />
    </div>
  );
}

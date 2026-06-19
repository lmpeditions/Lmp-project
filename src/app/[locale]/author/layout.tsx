import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { getCurrentUser } from "@/server/queries";
import { isStaff } from "@/server/rbac";
import { prisma } from "@/server/prisma";

export default async function AuthorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  if (isStaff(user.role)) redirect(`/${locale}/admin`);

  const [dossier, unread] = await Promise.all([
    prisma.dossier.findFirst({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      select: { trackingNumber: true },
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="author" trackingNumber={dossier?.trackingNumber} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={user.name}
          userRole="Auteur · LMP"
          notifications={unread}
          notificationsHref="/author/notifications"
        />
        <MobileNav variant="author" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

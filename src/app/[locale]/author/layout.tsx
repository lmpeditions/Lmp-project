import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { BookSwitcher } from "@/components/author/book-switcher";
import { getCurrentUser, getAuthorBooks, getActiveBook } from "@/server/queries";
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

  const [books, active, unread] = await Promise.all([
    getAuthorBooks(user.id),
    getActiveBook(user.id),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  const activeBook = books.find((b) => b.id === active?.id);

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="author" trackingNumber={activeBook?.trackingNumber} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={user.name}
          userRole="Auteur · LMP"
          notifications={unread}
          notificationsHref="/author/notifications"
          leading={books.length > 0 ? <BookSwitcher books={books} activeId={active?.id ?? null} /> : null}
        />
        <MobileNav variant="author" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

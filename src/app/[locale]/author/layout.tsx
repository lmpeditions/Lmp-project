import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { BookMarked } from "lucide-react";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { BookSwitcher } from "@/components/author/book-switcher";
import { StartBookForm } from "@/components/author/start-book-form";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { getCurrentUser, getAuthorBooks, getActiveBook } from "@/server/queries";
import { isStaff } from "@/server/rbac";
import { prisma } from "@/server/prisma";

// Authed, data-driven space: always render live (never statically cache),
// so figures are real-time and the build never queries the database.
export const dynamic = "force-dynamic";

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

  // First-book lock: an author with no book sees ONLY the onboarding screen —
  // no sidebar, no other route's content — until they create their first book.
  const books = await getAuthorBooks(user.id);
  if (books.length === 0) {
    const tb = await getTranslations("books");
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookMarked className="h-5 w-5" />
            </div>
            <p className="text-lg font-bold">LMP</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-2xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{tb("startTitle")}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{tb("startSubtitle")}</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <StartBookForm />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const [active, unread] = await Promise.all([
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

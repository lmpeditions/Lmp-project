import { setRequestLocale } from "next-intl/server";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { demoDossier } from "@/lib/mock-data";

export default async function AuthorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="author" trackingNumber={demoDossier.trackingNumber} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={demoDossier.authorName}
          userRole="Auteur · LMP"
          notifications={3}
          notificationsHref="/author/notifications"
        />
        <MobileNav variant="author" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

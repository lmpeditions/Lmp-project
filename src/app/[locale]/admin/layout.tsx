import { setRequestLocale } from "next-intl/server";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { MobileNav } from "@/components/shared/mobile-nav";

export default async function AdminLayout({
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
      <Sidebar variant="admin" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userName="Karim Benali" userRole="Admin · LMP" notifications={5} />
        <MobileNav variant="admin" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

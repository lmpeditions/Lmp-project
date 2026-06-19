import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { getCurrentUser } from "@/server/queries";
import { isStaff } from "@/server/rbac";

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "Super Admin · LMP",
  ADMIN: "Admin · LMP",
  MANAGER: "Manager · LMP",
};

export default async function AdminLayout({
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
  if (!isStaff(user.role)) redirect(`/${locale}/author`);

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={user.name}
          userRole={roleLabel[user.role] ?? "LMP"}
          notifications={0}
        />
        <MobileNav variant="admin" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

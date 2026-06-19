import { getTranslations } from "next-intl/server";
import { BookMarked } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Link } from "@/i18n/routing";

/** Centered card layout for public account pages (activate / forgot / reset). */
export async function AuthShell({
  title,
  subtitle,
  children,
  showBackToLogin = true,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showBackToLogin?: boolean;
}) {
  const tc = await getTranslations("common");
  const ta = await getTranslations("account");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookMarked className="h-5 w-5" />
          </div>
          <p className="text-lg font-bold">{tc("appName")}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {showBackToLogin && (
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-primary hover:underline">
                {ta("backToLogin")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { BookMarked, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/server/auth";
import { isStaff } from "@/server/rbac";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Already signed in → go straight to the right space.
  const session = await getSession();
  if (session) {
    redirect(`/${locale}/${isStaff(session.role) ? "admin" : "author"}`);
  }

  const t = await getTranslations("auth");
  const tc = await getTranslations("common");

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, hsl(248 80% 60% / 0.6), transparent 45%), radial-gradient(circle at 80% 70%, hsl(32 90% 55% / 0.45), transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-accent">
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold">{tc("appName")}</p>
            <p className="text-sm text-white/60">{tc("appFullName")}</p>
          </div>
        </div>

        <div className="relative max-w-md text-white">
          <h2 className="text-3xl font-bold leading-tight">{tc("tagline")}</h2>
          <p className="mt-4 text-white/70">{t("loginSubtitle")}</p>
          <div className="mt-8 flex items-center gap-2 text-sm text-white/60">
            <ShieldCheck className="h-4 w-4" />
            {t("secureAccess")}
          </div>
        </div>

        <p className="relative text-xs text-white/40">
          #LMP20260001 — {tc("confidential")}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-end gap-2 p-4 sm:p-6">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BookMarked className="h-5 w-5" />
              </div>
              <p className="text-lg font-bold">{tc("appName")}</p>
            </div>

            <h1 className="text-2xl font-bold tracking-tight">{t("loginTitle")}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("loginSubtitle")}</p>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

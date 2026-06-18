import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { BookMarked, ShieldCheck, ArrowRight, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
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

            <form className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("email")}</label>
                <input
                  type="email"
                  defaultValue="yasmine.elamrani@exemple.ma"
                  className="h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t("password")}</label>
                  <span className="text-xs text-primary hover:underline">
                    {t("forgotPassword")}
                  </span>
                </div>
                <input
                  type="password"
                  defaultValue="demo1234"
                  className="h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </form>

            <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
              {t("demoHint")}
            </div>

            <div className="mt-4 grid gap-3">
              <Link
                href="/author"
                className="group flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.99]"
              >
                {t("demoAuthor")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/admin"
                className="group flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold transition-all hover:bg-muted active:scale-[0.99]"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t("demoAdmin")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

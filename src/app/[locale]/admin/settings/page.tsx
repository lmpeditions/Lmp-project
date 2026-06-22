import { setRequestLocale, getTranslations } from "next-intl/server";
import { Settings, Languages, Palette, ShieldCheck, Check, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ActionButton } from "@/components/shared/action-button";

const ROLES = ["superAdmin", "admin", "manager", "author"] as const;
const MODULES = ["dossiers", "users", "payments", "tickets", "statistics", "settings"] as const;

// Permission matrix: which roles can access each back-office module.
const matrix: Record<(typeof MODULES)[number], Record<(typeof ROLES)[number], boolean>> = {
  dossiers: { superAdmin: true, admin: true, manager: true, author: false },
  users: { superAdmin: true, admin: true, manager: false, author: false },
  payments: { superAdmin: true, admin: true, manager: false, author: false },
  tickets: { superAdmin: true, admin: true, manager: true, author: false },
  statistics: { superAdmin: true, admin: true, manager: true, author: false },
  settings: { superAdmin: true, admin: false, manager: false, author: false },
};

export const dynamic = "force-dynamic";
export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adminSettings");
  const tNav = await getTranslations("nav");
  const tRoles = await getTranslations("adminUsers.roles");
  const tc = await getTranslations("common");

  const inputClass =
    "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General config */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <CardTitle>{t("general")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("orgName")}</label>
              <input type="text" defaultValue="Les Manuscrits Publiés (LMP)" className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("defaultLanguage")}
                </label>
                <select className={inputClass} defaultValue="fr">
                  <option value="fr">{tc("french")}</option>
                  <option value="en">{tc("english")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("defaultTheme")}
                </label>
                <select className={inputClass} defaultValue="system">
                  <option value="light">{tc("lightMode")}</option>
                  <option value="dark">{tc("darkMode")}</option>
                  <option value="system">{tc("systemMode")}</option>
                </select>
              </div>
            </div>
            <ActionButton successMessage={t("saved")}>{tc("save")}</ActionButton>
          </CardContent>
        </Card>

        {/* Languages & themes */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <CardTitle>{t("languages")} · {t("themes")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium">{tc("french")}</span>
              <Badge tone="success" dot>{tc("french")}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium">{tc("english")}</span>
              <Badge tone="success" dot>{tc("english")}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr"
                ? "Architecture i18n extensible : ajoutez une locale dans src/i18n/routing.ts et un fichier messages/<locale>.json."
                : "Extensible i18n: add a locale in src/i18n/routing.ts and a messages/<locale>.json file."}
            </p>
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg border border-border bg-background p-3 text-center text-xs">
                {tc("lightMode")}
              </div>
              <div className="flex-1 rounded-lg border border-border bg-sidebar p-3 text-center text-xs text-white">
                {tc("darkMode")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions matrix */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <CardTitle>{t("permissions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("permissionsHint")}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t("module")}</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-4 py-3 text-center font-medium">
                      {tRoles(r)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => (
                  <tr key={m} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-medium">{tNav(m)}</td>
                    {ROLES.map((r) => (
                      <td key={r} className="px-4 py-3 text-center">
                        {matrix[m][r] ? (
                          <Check className="mx-auto h-4 w-4 text-success" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

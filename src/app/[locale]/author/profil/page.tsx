import { setRequestLocale, getTranslations } from "next-intl/server";
import { User, Mail, Phone, MapPin, Palette, Languages, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ActionButton } from "@/components/shared/action-button";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/queries";

export const dynamic = "force-dynamic";
export default async function ProfilPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profil");
  const tc = await getTranslations("common");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}`);
  const p = {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    address: user.address ?? "",
  };

  const fields = [
    { icon: User, label: t("name"), value: p.name, type: "text" },
    { icon: Mail, label: t("email"), value: p.email, type: "email" },
    { icon: Phone, label: t("phone"), value: p.phone, type: "tel" },
    { icon: MapPin, label: t("address"), value: p.address, type: "text" },
  ];

  const inputClass =
    "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar / identity */}
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-bold text-white">
            {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <p className="mt-4 text-lg font-semibold">{p.name}</p>
          <p className="text-sm text-muted-foreground">{p.email}</p>
        </Card>

        {/* Personal info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("personalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium">
                    <f.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {f.label}
                  </label>
                  <input type={f.type} defaultValue={f.value} className={inputClass} />
                </div>
              ))}
            </div>
            <ActionButton successMessage={t("saved")}>{tc("save")}</ActionButton>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t("preferences")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Languages className="h-4 w-4 text-muted-foreground" />
                {tc("language")}
              </span>
              <LanguageSwitcher />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Palette className="h-4 w-4 text-muted-foreground" />
                {tc("darkMode")} / {tc("lightMode")}
              </span>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle>{t("security")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("currentPassword")}</label>
              <input type="password" className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("newPassword")}</label>
                <input type="password" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("confirmPassword")}</label>
                <input type="password" className={inputClass} />
              </div>
            </div>
            <ActionButton variant="outline" successMessage={t("saved")}>
              {t("changePassword")}
            </ActionButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

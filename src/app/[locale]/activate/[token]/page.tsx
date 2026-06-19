import { setRequestLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { activateAction } from "@/server/crm-actions";

export default async function ActivatePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  return (
    <AuthShell title={t("activateTitle")} subtitle={t("activateSubtitle")} showBackToLogin={false}>
      <SetPasswordForm action={activateAction} token={token} />
    </AuthShell>
  );
}

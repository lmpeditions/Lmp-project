import { setRequestLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { resetPasswordAction } from "@/server/crm-actions";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  return (
    <AuthShell title={t("resetTitle")} subtitle={t("resetSubtitle")}>
      <SetPasswordForm action={resetPasswordAction} token={token} />
    </AuthShell>
  );
}

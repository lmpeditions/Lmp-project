import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyOtpForm } from "@/components/auth/verify-otp-form";
import { getPendingLogin } from "@/server/otp";

export const dynamic = "force-dynamic";

export default async function VerifyOtpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // No pending login (cookie absent/expired) → back to the login screen.
  const pending = await getPendingLogin();
  if (!pending) redirect(`/${locale}`);

  const t = await getTranslations("otp");

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")} showBackToLogin>
      <VerifyOtpForm />
    </AuthShell>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getSession } from "@/server/auth";
import { isStaff } from "@/server/rbac";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (session) redirect(`/${locale}/${isStaff(session.role) ? "admin" : "author"}`);

  const t = await getTranslations("signup");

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <SignupForm />
    </AuthShell>
  );
}

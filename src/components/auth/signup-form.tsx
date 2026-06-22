"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { UserPlus, AlertCircle } from "lucide-react";
import { signupAction, type SignupState } from "@/server/auth-actions";

const inputClass =
  "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function SignupForm() {
  const t = useTranslations("signup");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<SignupState, FormData>(signupAction, {});

  const errors: Record<string, string> = {
    emailTaken: t("errorEmailTaken"),
    mismatch: t("errorMismatch"),
    weak: t("errorWeak"),
    tooManyAttempts: t("errorTooMany"),
    server: t("errorServer"),
  };

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">{t("name")}</label>
        <input id="name" name="name" type="text" required maxLength={200} autoComplete="name" className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">{t("password")}</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm" className="text-sm font-medium">{t("confirm")}</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </div>

      {state.error && (
        <p className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errors[state.error]}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <UserPlus className="h-4 w-4" />
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Script from "next/script";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { submitApplicationAction, type ApplicationActionState } from "@/server/application-actions";

const inputClass =
  "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function ApplicationForm() {
  const t = useTranslations("apply");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<ApplicationActionState, FormData>(
    submitApplicationAction,
    {},
  );

  const errors: Record<string, string> = {
    validation: t("errorValidation"),
    captcha: t("errorCaptcha"),
    tooManyAttempts: t("errorTooMany"),
    server: t("errorServer"),
  };

  if (state.ok) {
    return (
      <div className="space-y-3 rounded-lg border border-success/30 bg-success/10 p-4 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
        <p className="font-semibold">{t("successTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-sm font-medium">{t("fullName")}</label>
        <input id="fullName" name="fullName" required maxLength={200} className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="nationality" className="text-sm font-medium">{t("nationality")}</label>
          <input id="nationality" name="nationality" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium">{t("phone")}</label>
          <input id="phone" name="phone" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="cin" className="text-sm font-medium">{t("cin")}</label>
          <input id="cin" name="cin" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="profession" className="text-sm font-medium">{t("profession")}</label>
          <input id="profession" name="profession" className={inputClass} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="address" className="text-sm font-medium">{t("address")}</label>
        <input id="address" name="address" className={inputClass} />
      </div>

      {siteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          <div className="cf-turnstile" data-sitekey={siteKey} data-theme="auto" />
        </>
      )}

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

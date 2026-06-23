"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  verifyOtpAction,
  resendOtpAction,
  type VerifyOtpState,
  type ResendOtpState,
} from "@/server/auth-actions";

const inputClass =
  "h-12 w-full rounded-md border border-border bg-card px-3.5 text-center font-mono text-lg tracking-[0.5em] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function VerifyOtpForm() {
  const t = useTranslations("otp");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<VerifyOtpState, FormData>(
    verifyOtpAction,
    {},
  );
  const [resend, resendAction, resending] = useActionState<ResendOtpState, FormData>(
    resendOtpAction,
    {},
  );

  const errors: Record<string, string> = {
    invalidCode: t("errInvalid"),
    expired: t("errExpired"),
    tooManyAttempts: t("errTooMany"),
    expiredSession: t("errSession"),
  };

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        <div className="space-y-1.5">
          <label htmlFor="code" className="text-sm font-medium">
            {t("codeLabel")}
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            className={inputClass}
          />
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
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t("verifying") : t("verify")}
          {!pending && (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </button>
      </form>

      <form action={resendAction} className="text-center">
        <input type="hidden" name="locale" value={locale} />
        {resend.ok ? (
          <p className="flex items-center justify-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> {t("resent")}
          </p>
        ) : (
          <button
            type="submit"
            disabled={resending}
            className="text-sm text-primary hover:underline disabled:opacity-60"
          >
            {resending ? t("resending") : t("resend")}
          </button>
        )}
      </form>
    </div>
  );
}

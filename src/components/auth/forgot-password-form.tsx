"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { requestResetAction, type ResetRequestState } from "@/server/crm-actions";

const inputClass =
  "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function ForgotPasswordForm() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<ResetRequestState, FormData>(
    requestResetAction,
    {},
  );

  if (state.ok) {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            <strong className="block">{t("sentTitle")}</strong>
            {t("sentBody")}
          </span>
        </p>
        {state.resetLink && (
          <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs">
            <p className="mb-1 font-semibold">{t("devLinkLabel")}</p>
            <a href={state.resetLink} className="break-all text-primary hover:underline">
              {state.resetLink}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t("sending") : t("sendLink")}
      </button>
    </form>
  );
}

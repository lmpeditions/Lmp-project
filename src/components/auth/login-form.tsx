"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, AlertCircle } from "lucide-react";
import { loginAction, type LoginState } from "@/server/auth-actions";

const inputClass =
  "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

/** Real login form: posts to the loginAction Server Action. */
export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="mt-8 space-y-4">
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
          defaultValue="yasmine.elamrani@exemple.ma"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            {t("password")}
          </label>
          <span className="text-xs text-primary hover:underline">
            {t("forgotPassword")}
          </span>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          defaultValue="demo1234"
          className={inputClass}
        />
      </div>

      {state.error && (
        <p className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {t(state.error)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t("signingIn") : t("signIn")}
        {!pending && (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </button>

      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-semibold">{t("demoAccounts")}</p>
        <ul className="space-y-0.5">
          <li>karim.benali@lmp.ma — {t("demoAdmin")}</li>
          <li>yasmine.elamrani@exemple.ma — {t("demoAuthor")}</li>
          <li className="opacity-70">{t("password")}: demo1234</li>
        </ul>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { changePasswordAction, type ChangePasswordState } from "@/server/profile-actions";

const inputClass =
  "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

/** Author changes their own password (current password required). */
export function ChangePasswordForm() {
  const t = useTranslations("profil");
  const ta = useTranslations("account");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(
    changePasswordAction,
    {},
  );

  // Clear the password fields once the change succeeds.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  const errorMsg =
    state.error === "mismatch"
      ? ta("errMismatch")
      : state.error === "weak"
        ? ta("errWeak")
        : state.error === "wrongCurrent"
          ? t("errCurrentWrong")
          : state.error
            ? ta("errServer")
            : null;

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="currentPassword" className="text-sm font-medium">
          {t("currentPassword")}
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="newPassword" className="text-sm font-medium">
            {t("newPassword")}
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirm" className="text-sm font-medium">
            {t("confirmPassword")}
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-card px-5 text-sm font-semibold transition-all hover:bg-muted active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t("saving") : t("changePassword")}
        </button>
        {state.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            {t("passwordChanged")}
          </span>
        )}
        {errorMsg && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-danger">
            <AlertCircle className="h-4 w-4" />
            {errorMsg}
          </span>
        )}
      </div>
    </form>
  );
}

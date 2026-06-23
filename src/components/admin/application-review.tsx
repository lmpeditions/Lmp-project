"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";
import {
  approveApplicationAction,
  rejectApplicationAction,
  type ReviewApplicationState,
} from "@/server/application-actions";
import type { ApplicationView } from "@/server/queries";

export function ApplicationReview({ app }: { app: ApplicationView }) {
  const t = useTranslations("adminApplications");
  const locale = useLocale();
  const [state, approveAction, pending] = useActionState<ReviewApplicationState, FormData>(
    approveApplicationAction,
    {},
  );

  if (state.ok) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/[0.06] p-4">
        <p className="flex items-center gap-2 font-semibold text-success">
          <CheckCircle2 className="h-5 w-5" /> {t("approved", { name: state.authorName ?? app.fullName })}
        </p>
        <p className="mt-1 text-sm">
          {t("authorNumber")}: <span className="font-mono font-semibold">{state.authorNumber}</span>
        </p>
        {state.activationLink && (
          <div className="mt-2 rounded-md border border-dashed border-border bg-card p-2.5 text-xs">
            <p className="mb-1 font-semibold">{t("activationLink")}</p>
            <a href={state.activationLink} className="break-all text-primary hover:underline">{state.activationLink}</a>
          </div>
        )}
      </div>
    );
  }

  const errors: Record<string, string> = {
    forbidden: t("errorGeneric"),
    notFound: t("errorGeneric"),
    emailTaken: t("errorEmailTaken"),
    server: t("errorGeneric"),
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{app.fullName}</p>
          <p className="text-xs text-muted-foreground">{app.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[app.profession, app.nationality, app.phone, app.cin, app.address].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <form action={approveAction}>
            <input type="hidden" name="applicationId" value={app.id} />
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <UserCheck className="h-4 w-4" /> {pending ? "…" : t("approve")}
            </button>
          </form>
          <form action={rejectApplicationAction}>
            <input type="hidden" name="applicationId" value={app.id} />
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              <X className="h-4 w-4" /> {t("reject")}
            </button>
          </form>
        </div>
      </div>
      {state.error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle className="h-4 w-4" /> {errors[state.error]}
        </p>
      )}
    </div>
  );
}

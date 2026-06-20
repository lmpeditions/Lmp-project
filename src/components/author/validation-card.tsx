"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Clock, Check, MessageCircleWarning, AlertCircle } from "lucide-react";
import { respondValidationAction, type ValidationActionState } from "@/server/validation-actions";
import type { ValidationView } from "@/server/queries";

function timeLeft(deadline: string): { days: number; hours: number } {
  const ms = new Date(deadline).getTime() - Date.now();
  const clamped = Math.max(0, ms);
  return { days: Math.floor(clamped / 86400000), hours: Math.floor((clamped % 86400000) / 3600000) };
}

/** A pending validation request the author can act on. */
export function ValidationCard({ v }: { v: ValidationView }) {
  const t = useTranslations("validation");
  const [state, formAction, pending] = useActionState<ValidationActionState, FormData>(
    respondValidationAction,
    {},
  );
  const left = timeLeft(v.deadline);

  const errors: Record<string, string> = {
    optionRequired: t("errorOption"),
    expired: t("errorExpired"),
    closed: t("errorClosed"),
    validation: t("errorGeneric"),
    forbidden: t("errorGeneric"),
    server: t("errorGeneric"),
  };

  return (
    <div className="rounded-lg border border-accent/40 bg-accent/[0.04] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{v.title}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
          <Clock className="h-3.5 w-3.5" />
          {t("daysLeft", { days: left.days, hours: left.hours })}
        </span>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="requestId" value={v.id} />

        <p className="text-sm text-muted-foreground">{t("chooseModel")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {v.options.map((o) => (
            <label
              key={o.id}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-card p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input type="radio" name="selectedOptionId" value={o.id} className="mt-0.5" />
              <span className="min-w-0">
                {v.kind === "COVER" && o.url && (
                  <img src={o.url} alt={o.label} className="mb-2 h-24 w-full rounded object-cover" />
                )}
                <span className="block text-sm font-medium">{o.label}</span>
                {o.url && (
                  <a href={o.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                    {t("viewModel")}
                  </a>
                )}
              </span>
            </label>
          ))}
        </div>

        <textarea
          name="comment"
          rows={2}
          placeholder={t("commentPlaceholder")}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />

        {state.error && (
          <p className="flex items-center gap-1.5 text-sm text-danger">
            <AlertCircle className="h-4 w-4" /> {errors[state.error]}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="submit"
            name="decision"
            value="changes"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
          >
            <MessageCircleWarning className="h-4 w-4" />
            {t("requestChanges")}
          </button>
          <button
            type="submit"
            name="decision"
            value="validate"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {pending ? t("sending") : t("validate")}
          </button>
        </div>
        {v.kind === "CORRECTION" && (
          <p className="text-xs text-muted-foreground">{t("lockedNote")}</p>
        )}
      </form>
    </div>
  );
}

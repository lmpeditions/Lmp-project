"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { FileX, CheckCircle2, AlertCircle } from "lucide-react";
import { requestTerminationAction, type TerminationActionState } from "@/server/termination-actions";

export function TerminationForm({ dossierId }: { dossierId: string }) {
  const t = useTranslations("resiliation");
  const [state, formAction, pending] = useActionState<TerminationActionState, FormData>(
    requestTerminationAction,
    {},
  );

  if (state.ok) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-success">
        <CheckCircle2 className="h-4 w-4" /> {t("requestSent")}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="dossierId" value={dossierId} />
      <textarea
        name="reason"
        rows={3}
        maxLength={2000}
        placeholder={t("reasonLabel")}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" required className="mt-0.5" />
        <span>{t("ack")}</span>
      </label>
      {state.error === "exists" && (
        <p className="flex items-center gap-1.5 text-sm text-warning">
          <AlertCircle className="h-4 w-4" /> {t("alreadyRequested")}
        </p>
      )}
      {(state.error === "server" || state.error === "forbidden" || state.error === "validation") && (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle className="h-4 w-4" /> {t("errorGeneric")}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-danger px-5 text-sm font-semibold text-danger-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
      >
        <FileX className="h-4 w-4" />
        {pending ? "…" : t("requestButton")}
      </button>
    </form>
  );
}

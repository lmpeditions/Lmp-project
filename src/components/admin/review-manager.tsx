"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { updateReviewAction, type ReviewActionState } from "@/server/review-actions";

const inputClass =
  "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function ReviewManager({
  dossierId,
  isbn,
  legalDeposit,
  relectureProgress,
  correctionProgress,
}: {
  dossierId: string;
  isbn: string;
  legalDeposit: string;
  relectureProgress: number;
  correctionProgress: number;
}) {
  const t = useTranslations("review");
  const [state, formAction, pending] = useActionState<ReviewActionState, FormData>(updateReviewAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="dossierId" value={dossierId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="isbn" className="text-sm font-medium">{t("isbnLabel")}</label>
          <input id="isbn" name="isbn" defaultValue={isbn} placeholder="978-…" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="legalDeposit" className="text-sm font-medium">{t("legalDepositLabel")}</label>
          <input id="legalDeposit" name="legalDeposit" defaultValue={legalDeposit} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="relectureProgress" className="text-sm font-medium">{t("relecture")} (%)</label>
          <input id="relectureProgress" name="relectureProgress" type="number" min={0} max={100} defaultValue={relectureProgress} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="correctionProgress" className="text-sm font-medium">{t("correction")} (%)</label>
          <input id="correctionProgress" name="correctionProgress" type="number" min={0} max={100} defaultValue={correctionProgress} className={inputClass} />
        </div>
      </div>

      {state.ok && (
        <p className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> {t("saved")}
        </p>
      )}
      {state.error && (
        <p className="flex items-center gap-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4" /> {t("saveError")}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {pending ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}

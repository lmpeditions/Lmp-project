"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { uploadInvoiceAction, type FinanceActionState } from "@/server/finance-actions";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function UploadInvoiceForm({ dossierId }: { dossierId: string }) {
  const t = useTranslations("finance");
  const [state, formAction, pending] = useActionState<FinanceActionState, FormData>(uploadInvoiceAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <input type="hidden" name="dossierId" value={dossierId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="amount" type="number" min={1} required placeholder={t("amountDH")} className={inputClass} />
        <input name="reference" maxLength={100} placeholder={t("referenceOptional")} className={inputClass} />
      </div>
      <input name="invoiceUrl" type="url" required placeholder={t("invoiceLink")} className={inputClass} />

      {state.ok && (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> {t("invoiceSent")}
        </p>
      )}
      {state.error && (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle className="h-4 w-4" /> {t("invoiceError")}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {pending ? t("sending") : t("uploadInvoice")}
        </button>
      </div>
    </form>
  );
}

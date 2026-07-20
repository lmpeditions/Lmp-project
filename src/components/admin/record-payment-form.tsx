"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Wallet, CheckCircle2, AlertCircle, X } from "lucide-react";
import { recordPaymentAction, type FinanceActionState } from "@/server/finance-actions";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

/** Global "record a payment" form for the admin payments page: pick a dossier, then record. */
export function RecordPaymentForm({ dossiers }: { dossiers: { id: string; label: string }[] }) {
  const t = useTranslations("finance");
  const tp = useTranslations("adminPayments");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FinanceActionState, FormData>(recordPaymentAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" /> {tp("recordPayment")}
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold"><Wallet className="h-4 w-4 text-primary" />{tp("recordPayment")}</p>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <form ref={ref} action={formAction} className="space-y-3">
        <select name="dossierId" required defaultValue="" className={inputClass}>
          <option value="" disabled>{tp("chooseDossier")}</option>
          {dossiers.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="amount" type="number" min={1} required placeholder={t("amountDH")} className={inputClass} />
          <input name="date" type="date" required className={inputClass} />
          <select name="method" defaultValue="TRANSFER" className={inputClass}>
            <option value="TRANSFER">{t("methodTransfer")}</option>
            <option value="CASH">{t("methodCash")}</option>
            <option value="CARD">{t("methodCard")}</option>
          </select>
          <input name="reference" required maxLength={100} placeholder={t("reference")} className={inputClass} />
        </div>
        <input name="invoiceUrl" type="url" required placeholder={t("invoiceLinkRequired")} className={inputClass} />
        <div className="flex items-center justify-between gap-2">
          {state.ok ? (
            <p className="flex items-center gap-1.5 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" />{t("saved")}</p>
          ) : state.error ? (
            <p className="flex items-center gap-1.5 text-xs text-danger"><AlertCircle className="h-3.5 w-3.5" />{state.error === "validation" ? t("actionError") : t("actionErrorServer")}</p>
          ) : <span />}
          <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {pending ? t("sending") : t("record")}
          </button>
        </div>
      </form>
    </div>
  );
}

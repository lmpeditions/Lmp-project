"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Wallet, ArrowDownUp, Lightbulb, Save, CheckCircle2, AlertCircle } from "lucide-react";
import {
  recordPaymentAction,
  addLedgerEntryAction,
  setFinancingStrategyAction,
  type FinanceActionState,
} from "@/server/finance-actions";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

function Feedback({ state }: { state: FinanceActionState }) {
  const t = useTranslations("finance");
  if (state.ok) return <p className="flex items-center gap-1.5 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" />{t("saved")}</p>;
  if (state.error) return <p className="flex items-center gap-1.5 text-xs text-danger"><AlertCircle className="h-3.5 w-3.5" />{t("actionError")}</p>;
  return null;
}

export function FinanceManager({ dossierId, financingStrategy }: { dossierId: string; financingStrategy: string }) {
  const t = useTranslations("finance");

  const [payState, payAction, payPending] = useActionState<FinanceActionState, FormData>(recordPaymentAction, {});
  const [ledState, ledAction, ledPending] = useActionState<FinanceActionState, FormData>(addLedgerEntryAction, {});
  const [stratState, stratAction, stratPending] = useActionState<FinanceActionState, FormData>(setFinancingStrategyAction, {});
  const payRef = useRef<HTMLFormElement>(null);
  const ledRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (payState.ok) payRef.current?.reset(); }, [payState]);
  useEffect(() => { if (ledState.ok) ledRef.current?.reset(); }, [ledState]);

  return (
    <div className="space-y-6">
      {/* Record payment */}
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-semibold"><Wallet className="h-4 w-4 text-primary" />{t("recordPayment")}</p>
        <form ref={payRef} action={payAction} className="space-y-3">
          <input type="hidden" name="dossierId" value={dossierId} />
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
            <Feedback state={payState} />
            <button type="submit" disabled={payPending} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {payPending ? t("sending") : t("record")}
            </button>
          </div>
        </form>
      </div>

      {/* Ledger entry */}
      <div className="space-y-3 border-t border-border pt-5">
        <p className="flex items-center gap-2 text-sm font-semibold"><ArrowDownUp className="h-4 w-4 text-primary" />{t("addMovement")}</p>
        <form ref={ledRef} action={ledAction} className="space-y-3">
          <input type="hidden" name="dossierId" value={dossierId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="direction" defaultValue="IN" className={inputClass}>
              <option value="IN">{t("directionIn")}</option>
              <option value="OUT">{t("directionOut")}</option>
            </select>
            <input name="amount" type="number" min={1} required placeholder={t("amountDH")} className={inputClass} />
            <input name="label" required maxLength={200} placeholder={t("movementLabel")} className={inputClass} />
            <input name="date" type="date" required className={inputClass} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Feedback state={ledState} />
            <button type="submit" disabled={ledPending} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {ledPending ? t("sending") : t("add")}
            </button>
          </div>
        </form>
      </div>

      {/* Financing strategy (replaces) */}
      <div className="space-y-3 border-t border-border pt-5">
        <p className="flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-accent" />{t("strategy")}</p>
        <form action={stratAction} className="space-y-3">
          <input type="hidden" name="dossierId" value={dossierId} />
          <textarea name="strategy" rows={3} defaultValue={financingStrategy} placeholder={t("strategyPlaceholder")} className={inputClass} />
          <p className="text-xs text-muted-foreground">{t("strategyHint")}</p>
          <div className="flex items-center justify-between gap-2">
            <Feedback state={stratState} />
            <button type="submit" disabled={stratPending} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              <Save className="h-3.5 w-3.5" />{stratPending ? t("sending") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

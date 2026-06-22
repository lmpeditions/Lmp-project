"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Send, AlertCircle } from "lucide-react";
import { createTicketAction, type TicketActionState } from "@/server/ticket-actions";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

const CATEGORIES: [string, string][] = [
  ["GENERAL", "general"],
  ["COMPLAINT", "complaint"],
  ["FINANCE", "finance"],
  ["PROOFREADING", "proofreading"],
  ["COVER", "cover"],
  ["COMMUNICATION", "communication"],
  ["TECHNICAL", "technical"],
];

export function CreateTicketForm() {
  const t = useTranslations("tickets");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<TicketActionState, FormData>(createTicketAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-1.5">
        <label htmlFor="subject" className="text-sm font-medium">{t("createSubject")}</label>
        <input id="subject" name="subject" required maxLength={200} className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="category" className="text-sm font-medium">{t("category")}</label>
        <select id="category" name="category" defaultValue="GENERAL" className={inputClass}>
          {CATEGORIES.map(([value, key]) => (
            <option key={value} value={value}>{t(`categories.${key}`)}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="body" className="text-sm font-medium">{t("createMessage")}</label>
        <textarea id="body" name="body" required rows={5} maxLength={5000} className={inputClass} />
      </div>
      {state.error && (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle className="h-4 w-4" /> {state.error === "noBook" ? t("noBook") : t("createError")}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {pending ? "…" : t("submit")}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles, AlertCircle } from "lucide-react";
import { createBookAction, type BookFormState } from "@/server/book-actions";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function StartBookForm() {
  const t = useTranslations("books");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<BookFormState, FormData>(createBookAction, {});

  const errors: Record<string, string> = {
    validation: t("errorValidation"),
    server: t("errorServer"),
  };

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-1.5">
        <label htmlFor="bookTitle" className="text-sm font-medium">
          {t("bookTitleLabel")}
        </label>
        <input
          id="bookTitle"
          name="bookTitle"
          type="text"
          required
          maxLength={300}
          placeholder={t("bookTitlePlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          {t("descriptionLabel")}
          <span className="ml-1 text-xs font-normal text-muted-foreground">({t("optional")})</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={2000}
          placeholder={t("descriptionPlaceholder")}
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">{t("descriptionHint")}</p>
      </div>

      {state.error && (
        <p className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errors[state.error]}
        </p>
      )}

      <div className="rounded-md border border-info/30 bg-info/10 px-3 py-2.5 text-xs text-info">
        {t("validationNotice")}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

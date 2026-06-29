"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Send, AlertCircle } from "lucide-react";
import { createValidationRequestAction, type ValidationActionState } from "@/server/validation-actions";
import { FileUploadField } from "@/components/shared/file-upload-field";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function CreateValidationForm({ dossierId }: { dossierId: string }) {
  const t = useTranslations("validation");
  const [state, formAction, pending] = useActionState<ValidationActionState, FormData>(
    createValidationRequestAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="dossierId" value={dossierId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="kind" className={inputClass} defaultValue="CORRECTION">
          <option value="CORRECTION">{t("kindCorrection")}</option>
          <option value="COVER">{t("kindCover")}</option>
          <option value="LAYOUT">{t("kindLayout")}</option>
        </select>
        <input name="title" required maxLength={200} placeholder={t("titleLabel")} className={inputClass} />
      </div>

      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <input
            name={`option${n}Label`}
            required
            maxLength={200}
            placeholder={t("modelLabel", { n })}
            className={`${inputClass} sm:flex-1`}
          />
          <div className="sm:flex-1">
            <FileUploadField name={`option${n}Url`} folder="covers" accept="image/*,.pdf" />
          </div>
        </div>
      ))}

      {state.error && (
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5" /> {t("createError")}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {pending ? t("sending") : t("sendRequest")}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Plus, AlertCircle } from "lucide-react";
import { addRemarkAction, type ReviewActionState } from "@/server/review-actions";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function RemarkForm({ dossierId }: { dossierId: string }) {
  const t = useTranslations("review");
  const [state, formAction, pending] = useActionState<ReviewActionState, FormData>(addRemarkAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="dossierId" value={dossierId} />
      <input name="title" required maxLength={200} placeholder={t("remarkTitlePlaceholder")} className={inputClass} />
      <textarea name="description" required rows={3} maxLength={4000} placeholder={t("remarkDescPlaceholder")} className={inputClass} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input name="attachmentName" placeholder={t("attachmentName")} className={inputClass} />
        <input name="attachmentUrl" type="url" placeholder={t("attachmentUrl")} className={inputClass} />
      </div>
      {state.error && (
        <p className="flex items-center gap-2 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5" /> {t("remarkError")}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {pending ? t("saving") : t("addRemark")}
        </button>
      </div>
    </form>
  );
}

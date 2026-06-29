"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { uploadAuthorDocumentAction, type DocActionState } from "@/server/document-actions";
import { FileUploadField } from "@/components/shared/file-upload-field";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function AuthorDocumentForm({ dossierId }: { dossierId: string }) {
  const t = useTranslations("documents");
  const router = useRouter();
  const [state, formAction, pending] = useActionState<DocActionState, FormData>(uploadAuthorDocumentAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <input type="hidden" name="dossierId" value={dossierId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="kind" defaultValue="introduction" className={inputClass}>
          <option value="introduction">{t("introduction")}</option>
          <option value="toc">{t("toc")}</option>
        </select>
        <FileUploadField name="url" folder="documents" required accept=".pdf,.doc,.docx,.odt,image/*" />
      </div>
      {state.ok && (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> {t("uploaded")}
        </p>
      )}
      {state.error && (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle className="h-4 w-4" /> {t("uploadError")}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {pending ? "…" : t("send")}
        </button>
      </div>
    </form>
  );
}

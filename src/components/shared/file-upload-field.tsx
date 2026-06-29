"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload, FileCheck2, Loader2, Link2, AlertCircle } from "lucide-react";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

type Folder = "documents" | "invoices" | "covers" | "attachments";

/**
 * Upload a file to Supabase Storage and submit its URL via a hidden input
 * named `name`. Degrades gracefully: if storage isn't configured (or upload
 * fails), it switches to a plain URL field so the form still works.
 */
export function FileUploadField({
  name,
  folder = "documents",
  accept,
  required = false,
  defaultUrl = "",
}: {
  name: string;
  folder?: Folder;
  accept?: string;
  required?: boolean;
  defaultUrl?: string;
}) {
  const t = useTranslations("upload");
  const [url, setUrl] = useState(defaultUrl);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<"file" | "url">("file");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setErrorMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "storage_not_configured") {
          // No storage yet → let the user paste a link instead.
          setMode("url");
          setStatus("idle");
          setErrorMsg(t("notConfigured"));
          return;
        }
        const map: Record<string, string> = {
          too_large: t("tooLarge"),
          type_not_allowed: t("typeNotAllowed"),
          unauthorized: t("error"),
          no_file: t("error"),
        };
        setStatus("error");
        setErrorMsg(map[data.error] ?? t("error"));
        return;
      }
      const data = (await res.json()) as { url: string; name: string };
      setUrl(data.url);
      setFileName(data.name);
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg(t("error"));
    }
  }

  if (mode === "url") {
    return (
      <div className="space-y-1.5">
        <input
          type="url"
          name={name}
          required={required}
          defaultValue={url}
          placeholder={t("urlPlaceholder")}
          className={inputClass}
        />
        <button type="button" onClick={() => setMode("file")} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <Upload className="h-3 w-3" /> {t("switchToFile")}
        </button>
        {errorMsg && <p className="flex items-center gap-1 text-xs text-muted-foreground"><AlertCircle className="h-3 w-3" />{errorMsg}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Carries the uploaded URL to the parent form. */}
      <input type="hidden" name={name} value={url} />

      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:bg-muted/60">
        {status === "uploading" ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : url ? (
          <FileCheck2 className="h-4 w-4 text-success" />
        ) : (
          <Upload className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          {status === "uploading" ? t("uploading") : url ? fileName || t("uploaded") : t("choose")}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          required={required && !url}
          onChange={handleFile}
          className="hidden"
        />
      </label>

      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <Link2 className="h-3 w-3" /> {t("view")}
        </a>
      )}
      {status === "error" && <p className="flex items-center gap-1 text-xs text-danger"><AlertCircle className="h-3 w-3" />{errorMsg}</p>}
      <button type="button" onClick={() => setMode("url")} className="ml-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <Link2 className="h-3 w-3" /> {t("switchToUrl")}
      </button>
    </div>
  );
}

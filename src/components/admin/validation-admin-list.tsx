import { getTranslations } from "next-intl/server";
import { Gavel } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { editorDecideAction } from "@/server/validation-actions";
import type { ValidationView } from "@/server/queries";

/** Admin view of a dossier's validation requests, with editor-decide on expired ones. */
export async function ValidationAdminList({ validations }: { validations: ValidationView[] }) {
  const t = await getTranslations("validation");
  if (validations.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{t("noRequests")}</p>;
  }

  const kindLabel = (k: ValidationView["kind"]) =>
    k === "CORRECTION" ? t("kindCorrection") : k === "COVER" ? t("kindCover") : t("kindLayout");

  const badge = (v: ValidationView): { tone: BadgeTone; label: string } => {
    if (v.expired) return { tone: "danger", label: t("expiredLabel") };
    if (v.status === "PENDING") return { tone: "warning", label: t("statusPending") };
    if (v.status === "VALIDATED") return { tone: "success", label: t("statusValidated") };
    if (v.status === "CHANGES_REQUESTED") return { tone: "warning", label: t("statusChanges") };
    return { tone: "info", label: t("statusEditor") };
  };

  return (
    <div className="space-y-3">
      {validations.map((v) => {
        const b = badge(v);
        const chosen = v.options.find((o) => o.id === v.selectedOptionId);
        return (
          <div key={v.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{kindLabel(v.kind)}</Badge>
                <span className="text-sm font-medium">{v.title}</span>
              </div>
              <Badge tone={b.tone}>{b.label}</Badge>
            </div>

            <p className="mt-1.5 text-xs text-muted-foreground">
              {v.options.map((o) => o.label).join(" · ")}
            </p>
            {chosen && (
              <p className="mt-1 text-sm">
                {t("chosen")}: <span className="font-medium">{chosen.label}</span>
              </p>
            )}
            {v.authorComment && (
              <p className="mt-1 text-sm text-muted-foreground">“{v.authorComment}”</p>
            )}

            {v.expired && (
              <form action={editorDecideAction} className="mt-3 flex flex-col gap-2 rounded-md border border-danger/30 bg-danger/[0.04] p-2.5 sm:flex-row sm:items-center">
                <span className="flex items-center gap-1.5 text-xs font-medium text-danger">
                  <Gavel className="h-3.5 w-3.5" /> {t("editorDecideTitle")}
                </span>
                <input type="hidden" name="requestId" value={v.id} />
                <select
                  name="selectedOptionId"
                  required
                  defaultValue=""
                  className="h-9 rounded-md border border-border bg-card px-2 text-sm outline-none sm:ml-auto"
                >
                  <option value="" disabled>
                    {t("chooseModel")}
                  </option>
                  {v.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Gavel className="h-3.5 w-3.5" />
                  {t("decideBtn")}
                </button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}

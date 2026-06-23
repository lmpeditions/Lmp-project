"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, AlertCircle, ShieldPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { createAdminAction, type CreateAdminState } from "@/server/crm-actions";

const inputClass =
  "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function CreateAdminForm() {
  const t = useTranslations("adminCreate");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<CreateAdminState, FormData>(
    createAdminAction,
    {},
  );

  const errors: Record<string, string> = {
    emailTaken: t("errorEmailTaken"),
    validation: t("errorValidation"),
    forbidden: t("errorForbidden"),
    server: t("errorServer"),
  };

  if (state.ok) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">{t("createdTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("createdBody", { name: state.adminName ?? "" })}
            </p>
          </div>
          {state.activationLink && (
            <div className="mx-auto max-w-xl rounded-md border border-dashed border-border bg-muted/40 p-3 text-left text-xs">
              <p className="mb-1 font-semibold">{t("devLinkLabel")}</p>
              <a href={state.activationLink} className="break-all text-primary hover:underline">
                {state.activationLink}
              </a>
            </div>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <a
              href={`/${locale}/admin/users/new-admin`}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {t("another")}
            </a>
            <Link
              href="/admin/users"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {t("backToList")}
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />

      <Card>
        <CardHeader>
          <CardTitle>{t("section")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t("name")}
            </label>
            <input id="name" name="name" type="text" required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              {t("email")}
            </label>
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="role" className="text-sm font-medium">
              {t("role")}
            </label>
            <select id="role" name="role" defaultValue="ADMIN" className={inputClass}>
              <option value="ADMIN">{t("roleAdmin")}</option>
              <option value="MANAGER">{t("roleManager")}</option>
              <option value="SUPER_ADMIN">{t("roleSuperAdmin")}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {state.error && (
        <p className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errors[state.error]}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShieldPlus className="h-4 w-4" />
          {pending ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}

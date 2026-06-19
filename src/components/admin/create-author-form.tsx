"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, AlertCircle, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { createAuthorAction, type CreateAuthorState } from "@/server/crm-actions";

const inputClass =
  "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

function Field({
  name,
  label,
  required,
  type = "text",
  hint,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">({hint})</span>}
      </label>
      <input id={name} name={name} type={type} required={required} className={inputClass} />
    </div>
  );
}

export function CreateAuthorForm() {
  const t = useTranslations("crm");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<CreateAuthorState, FormData>(
    createAuthorAction,
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
              {t("createdBody", { name: state.authorName ?? "" })}
            </p>
          </div>
          {state.activationLink && (
            <div className="mx-auto max-w-xl rounded-md border border-dashed border-border bg-muted/40 p-3 text-left text-xs">
              <p className="mb-1 font-semibold">{t("devLinkLabel")}</p>
              <a
                href={state.activationLink}
                className="break-all text-primary hover:underline"
              >
                {state.activationLink}
              </a>
            </div>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <a
              href={`/${locale}/admin/users/new`}
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
          <CardTitle>{t("sectionAuthor")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field name="name" label={t("name")} required hint={t("required")} />
          <Field name="email" label={t("email")} type="email" required hint={t("required")} />
          <Field name="nationality" label={t("nationality")} hint={t("optional")} />
          <Field name="phone" label={t("phone")} hint={t("optional")} />
          <Field name="cin" label={t("cin")} hint={t("optional")} />
          <Field name="profession" label={t("profession")} hint={t("optional")} />
          <div className="sm:col-span-2">
            <Field name="address" label={t("address")} hint={t("optional")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sectionBook")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field name="bookTitle" label={t("bookTitle")} required hint={t("required")} />
          </div>
          <Field name="formula" label={t("formula")} required hint={t("required")} />
          <Field name="contractTotal" label={t("contractTotal")} type="number" />
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
          <UserPlus className="h-4 w-4" />
          {pending ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}

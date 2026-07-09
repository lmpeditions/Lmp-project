"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Mail, Phone, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { updateProfileAction, type UpdateProfileState } from "@/server/profile-actions";

const inputClass =
  "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

/** Author edits their own name / phone / address (e-mail is locked). */
export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; phone: string; address: string };
}) {
  const t = useTranslations("profil");
  const tc = useTranslations("common");
  const router = useRouter();
  const [state, formAction, pending] = useActionState<UpdateProfileState, FormData>(
    updateProfileAction,
    {},
  );

  // Refresh the server component tree so the avatar/top-bar reflect the new name.
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="flex items-center gap-1.5 text-sm font-medium">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            {t("name")}
          </label>
          <input id="name" name="name" type="text" required maxLength={200} defaultValue={initial.name} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            {t("email")}
          </label>
          <input type="email" defaultValue={initial.email} disabled className={`${inputClass} cursor-not-allowed opacity-60`} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-medium">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {t("phone")}
          </label>
          <input id="phone" name="phone" type="tel" maxLength={40} defaultValue={initial.phone} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="address" className="flex items-center gap-1.5 text-sm font-medium">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {t("address")}
          </label>
          <input id="address" name="address" type="text" maxLength={300} defaultValue={initial.address} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t("saving") : tc("save")}
        </button>
        {state.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            {t("saved")}
          </span>
        )}
        {state.error && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-danger">
            <AlertCircle className="h-4 w-4" />
            {t("errServer")}
          </span>
        )}
      </div>
    </form>
  );
}

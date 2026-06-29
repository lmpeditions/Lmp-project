"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pencil, Ban, Trash2, CheckCircle2, X, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  updateUserAction,
  setUserStatusAction,
  deleteUserAction,
  type UserActionState,
} from "@/server/user-actions";
import type { AdminUser, UserRole, UserStatus } from "@/lib/types";

const roleTone: Record<UserRole, BadgeTone> = {
  superAdmin: "danger",
  admin: "primary",
  manager: "info",
  author: "neutral",
};
const statusTone: Record<UserStatus, BadgeTone> = {
  active: "success",
  suspended: "warning",
  invited: "info",
};

const roleViewToDb: Record<UserRole, string> = { superAdmin: "SUPER_ADMIN", admin: "ADMIN", manager: "MANAGER", author: "AUTHOR" };
const statusViewToDb: Record<UserStatus, string> = { active: "ACTIVE", suspended: "SUSPENDED", invited: "INVITED" };
const ROLE_KEYS: UserRole[] = ["superAdmin", "admin", "manager", "author"];
const STATUS_KEYS: UserStatus[] = ["active", "suspended", "invited"];

const inputClass =
  "h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function UserTable({ users }: { users: AdminUser[] }) {
  const t = useTranslations("adminUsers");
  const [editing, setEditing] = useState<AdminUser | null>(null);

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">{t("name")}</th>
                  <th className="px-5 py-3 font-medium">{t("role")}</th>
                  <th className="px-5 py-3 font-medium">{t("status")}</th>
                  <th className="px-5 py-3 font-medium">{t("dossiers")}</th>
                  <th className="px-5 py-3 font-medium">{t("lastActive")}</th>
                  <th className="px-5 py-3 text-right font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-white">
                          {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={roleTone[u.role]}>{t(`roles.${u.role}`)}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={statusTone[u.status]} dot>{t(`statuses.${u.status}`)}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{u.dossierCount || "—"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {u.lastActive === "—" ? "—" : formatDate(u.lastActive, "fr")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label={t("edit")} onClick={() => setEditing(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <form action={setUserStatusAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <Button type="submit" variant="ghost" size="icon" aria-label={t("toggleStatus")}>
                            {u.status === "suspended" ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Ban className="h-4 w-4 text-warning" />
                            )}
                          </Button>
                        </form>
                        <DeleteUserButton userId={u.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function DeleteUserButton({ userId }: { userId: string }) {
  const t = useTranslations("adminUsers");
  const router = useRouter();
  const [state, action] = useActionState<UserActionState, FormData>(deleteUserAction, {});

  const errors: Record<string, string> = {
    self: t("errSelf"),
    lastAdmin: t("errLastAdmin"),
    hasLinkedData: t("errLinked"),
    forbidden: t("errGeneric"),
    notFound: t("errGeneric"),
    server: t("errGeneric"),
  };

  useEffect(() => {
    if (state.ok) router.refresh();
    else if (state.error) window.alert(errors[state.error]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} onSubmit={(e) => { if (!window.confirm(t("confirmDelete"))) e.preventDefault(); }}>
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" variant="ghost" size="icon" aria-label={t("delete")}>
        <Trash2 className="h-4 w-4 text-danger" />
      </Button>
    </form>
  );
}

function EditUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const t = useTranslations("adminUsers");
  const router = useRouter();
  const [state, action, pending] = useActionState<UserActionState, FormData>(updateUserAction, {});

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const errors: Record<string, string> = {
    self: t("errSelf"),
    lastAdmin: t("errLastAdmin"),
    validation: t("errGeneric"),
    forbidden: t("errGeneric"),
    notFound: t("errGeneric"),
    server: t("errGeneric"),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("editTitle")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form action={action} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">{t("name")}</label>
            <input id="name" name="name" defaultValue={user.name} required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="role" className="text-sm font-medium">{t("role")}</label>
              <select id="role" name="role" defaultValue={roleViewToDb[user.role]} className={inputClass}>
                {ROLE_KEYS.map((k) => <option key={k} value={roleViewToDb[k]}>{t(`roles.${k}`)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium">{t("status")}</label>
              <select id="status" name="status" defaultValue={statusViewToDb[user.status]} className={inputClass}>
                {STATUS_KEYS.map((k) => <option key={k} value={statusViewToDb[k]}>{t(`statuses.${k}`)}</option>)}
              </select>
            </div>
          </div>
          {state.error && (
            <p className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />{errors[state.error]}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
              {t("cancel")}
            </button>
            <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {pending ? "…" : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Ban, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
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

export function UserTable({ users: initial }: { users: AdminUser[] }) {
  const t = useTranslations("adminUsers");
  const [users, setUsers] = useState(initial);

  function toggleStatus(id: string) {
    setUsers((u) =>
      u.map((x) =>
        x.id === id
          ? { ...x, status: x.status === "suspended" ? "active" : "suspended" }
          : x
      )
    );
  }

  return (
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
                    <Badge tone={statusTone[u.status]} dot>
                      {t(`statuses.${u.status}`)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{u.dossierCount || "—"}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {u.lastActive === "—" ? "—" : formatDate(u.lastActive, "fr")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="toggle status"
                        onClick={() => toggleStatus(u.id)}
                      >
                        {u.status === "suspended" ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Ban className="h-4 w-4 text-warning" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="delete">
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

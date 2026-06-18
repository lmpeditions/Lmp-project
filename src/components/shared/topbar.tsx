"use client";

import { useTranslations } from "next-intl";
import { Bell, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";

interface TopbarProps {
  userName: string;
  userRole: string;
  notifications?: number;
  /** Optional href for the notification bell (e.g. "/author/notifications"). */
  notificationsHref?: string;
}

export function Topbar({ userName, userRole, notifications = 0, notificationsHref }: TopbarProps) {
  const tCommon = useTranslations("common");
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="relative hidden flex-1 sm:block sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={tCommon("search")}
          className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        {(() => {
          const bellClass =
            "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-muted";
          const bellInner = (
            <>
              <Bell className="h-[1.1rem] w-[1.1rem]" />
              {notifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
                  {notifications}
                </span>
              )}
            </>
          );
          return notificationsHref ? (
            <Link href={notificationsHref} aria-label={tCommon("notifications")} className={bellClass}>
              {bellInner}
            </Link>
          ) : (
            <button type="button" aria-label={tCommon("notifications")} className={bellClass}>
              {bellInner}
            </button>
          );
        })()}

        <div className="ml-1 flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="hidden leading-tight md:block">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

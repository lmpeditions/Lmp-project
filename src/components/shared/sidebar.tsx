"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { authorNav, adminNav } from "@/lib/nav";

interface SidebarProps {
  /** Which navigation set to render. Serializable across the RSC boundary. */
  variant: "author" | "admin";
  trackingNumber?: string;
}

export function Sidebar({ variant, trackingNumber }: SidebarProps) {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const items = variant === "author" ? authorNav : adminNav;
  const spaceKey = variant === "author" ? "authorSpace" : "adminSpace";
  const rootHref = variant === "author" ? "/author" : "/admin";

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent text-white">
          <BookMarked className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">{tCommon("appName")}</p>
          <p className="text-[11px] text-sidebar-foreground/70">{tCommon("tagline")}</p>
        </div>
      </div>

      <div className="px-4 pb-2 pt-1">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          {tNav(spaceKey)}
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== rootHref && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-white shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
              <span className="truncate">{tNav(item.labelKey)}</span>
              {item.badge ? (
                <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {trackingNumber && (
        <div className="m-3 rounded-lg bg-white/5 p-3">
          <p className="text-[11px] text-sidebar-foreground/60">
            {tCommon("appFullName")}
          </p>
          <p className="font-mono text-sm font-semibold text-white">
            {trackingNumber}
          </p>
        </div>
      )}
    </aside>
  );
}

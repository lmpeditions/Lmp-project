"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { authorNav, adminNav } from "@/lib/nav";

interface MobileNavProps {
  /** Which navigation set to render. Serializable across the RSC boundary. */
  variant: "author" | "admin";
}

/** Horizontal scrollable navigation shown on small screens (< lg). */
export function MobileNav({ variant }: MobileNavProps) {
  const pathname = usePathname();
  const tNav = useTranslations("nav");

  const items = variant === "author" ? authorNav : adminNav;
  const rootHref = variant === "author" ? "/author" : "/admin";

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
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
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tNav(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

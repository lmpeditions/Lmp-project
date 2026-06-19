import {
  LayoutDashboard,
  Stamp,
  BookOpen,
  Image,
  LayoutTemplate,
  Megaphone,
  Wallet,
  FolderOpen,
  Ticket,
  FileX,
  User,
  Users,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  /** Translation key under "nav". */
  labelKey: string;
  icon: LucideIcon;
  badge?: number;
}

/** Author front-office navigation — mirrors the portal modules in the spec. */
export const authorNav: NavItem[] = [
  { href: "/author", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/author/isbn", labelKey: "isbn", icon: Stamp },
  { href: "/author/relecture", labelKey: "relecture", icon: BookOpen },
  { href: "/author/couverture", labelKey: "couverture", icon: Image },
  { href: "/author/mise-en-page", labelKey: "miseEnPage", icon: LayoutTemplate },
  { href: "/author/communication", labelKey: "communication", icon: Megaphone },
  { href: "/author/finances", labelKey: "finances", icon: Wallet },
  { href: "/author/documents", labelKey: "documents", icon: FolderOpen },
  { href: "/author/tickets", labelKey: "tickets", icon: Ticket },
  { href: "/author/resiliation", labelKey: "resiliation", icon: FileX },
  { href: "/author/profil", labelKey: "profil", icon: User },
];

/** LMP back-office navigation. */
export const adminNav: NavItem[] = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/dossiers", labelKey: "dossiers", icon: FolderOpen },
  { href: "/admin/users", labelKey: "users", icon: Users },
  { href: "/admin/tickets", labelKey: "tickets", icon: Ticket },
  { href: "/admin/payments", labelKey: "payments", icon: Wallet },
  { href: "/admin/statistics", labelKey: "statistics", icon: BarChart3 },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
];

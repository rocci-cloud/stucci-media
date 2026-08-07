import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Newspaper, FolderTree, MessageSquare, Settings } from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Articles", href: "/admin/articles", icon: Newspaper },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Comments", href: "/admin/comments", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

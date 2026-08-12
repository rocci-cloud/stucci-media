import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Newspaper,
  FolderTree,
  Image,
  Images,
  Link2,
  MessageSquare,
  Mail,
  Settings,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Articles", href: "/admin/articles", icon: Newspaper },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Banners", href: "/admin/banners", icon: Image },
  { label: "Media", href: "/admin/media", icon: Images },
  { label: "Redirects", href: "/admin/redirects", icon: Link2 },
  { label: "Comments", href: "/admin/comments", icon: MessageSquare },
  { label: "Weekly Digest", href: "/admin/digest", icon: Mail },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

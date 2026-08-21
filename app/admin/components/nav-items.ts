import type { LucideIcon } from "lucide-react";
import {
  ChartColumnIncreasing,
  FolderTree,
  Image,
  Images,
  Inbox,
  LayoutDashboard,
  Link2,
  Mail,
  MessageSquare,
  Mic,
  Newspaper,
  Rss,
  Settings,
  Trash2,
  UserSquare2,
  Users,
} from "lucide-react";
import { canManageSettings, canManageUsers, canModerateComments } from "../../lib/permissions";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Undefined means every staff role sees it. */
  visible?: (role: string | null | undefined) => boolean;
  group: "Content" | "Library" | "Site";
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, group: "Content" },
  { label: "Articles", href: "/admin/articles", icon: Newspaper, group: "Content" },
  { label: "Analytics", href: "/admin/analytics", icon: ChartColumnIncreasing, group: "Content" },
  { label: "Podcasts", href: "/admin/podcast-feeds", icon: Rss, visible: canManageSettings, group: "Content" },
  { label: "Comments", href: "/admin/comments", icon: MessageSquare, visible: canModerateComments, group: "Content" },

  { label: "Media", href: "/admin/media", icon: Images, group: "Library" },
  { label: "Categories", href: "/admin/categories", icon: FolderTree, visible: canManageSettings, group: "Library" },
  { label: "Authors", href: "/admin/authors", icon: UserSquare2, visible: canManageSettings, group: "Library" },
  { label: "Trash", href: "/admin/trash", icon: Trash2, group: "Library" },

  { label: "Inbox", href: "/admin/inbox", icon: Inbox, visible: canManageSettings, group: "Site" },
  { label: "Banners", href: "/admin/banners", icon: Image, visible: canManageSettings, group: "Site" },
  { label: "Subscribers", href: "/admin/subscribers", icon: Mail, visible: canManageSettings, group: "Site" },
  { label: "Weekly Digest", href: "/admin/digest", icon: Mail, visible: canManageSettings, group: "Site" },
  { label: "Redirects", href: "/admin/redirects", icon: Link2, visible: canManageSettings, group: "Site" },
  { label: "Users", href: "/admin/users", icon: Users, visible: canManageUsers, group: "Site" },
  { label: "Settings", href: "/admin/settings", icon: Settings, group: "Site" },
];

export function navItemsForRole(role: string | null | undefined): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => !item.visible || item.visible(role));
}

export const NAV_GROUP_ORDER: AdminNavItem["group"][] = ["Content", "Library", "Site"];

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemsForRole, NAV_GROUP_ORDER } from "./nav-items";
import { cn } from "../lib/cn";
import { useSession } from "../../lib/auth-client";

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const items = navItemsForRole(session?.user.role);

  return (
    <nav className="flex flex-col gap-3 px-3">
      {NAV_GROUP_ORDER.map((group) => {
        const groupItems = items.filter((item) => item.group === group);
        if (groupItems.length === 0) return null;

        return (
          <div key={group} className="flex flex-col gap-0.5">
            <span className="px-3 pt-1 pb-1 text-[10px] font-semibold tracking-widest text-white/30 uppercase">
              {group}
            </span>
            {groupItems.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-10 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--admin-sidebar-active-bg)] text-[var(--admin-sidebar-fg-active)]"
                      : "text-[var(--admin-sidebar-fg)] hover:bg-[var(--admin-sidebar-active-bg)] hover:text-[var(--admin-sidebar-fg-active)]"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

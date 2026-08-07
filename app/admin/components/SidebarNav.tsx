"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "./nav-items";
import { cn } from "../lib/cn";

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {ADMIN_NAV_ITEMS.map((item) => {
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
    </nav>
  );
}

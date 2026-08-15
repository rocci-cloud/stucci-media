"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Moon, Search, Sun, User as UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { ADMIN_NAV_ITEMS } from "./nav-items";
import { ROLE_LABELS, type AppRole } from "../../lib/permissions";
import MobileSidebar from "./MobileSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { authClient, useSession } from "../../lib/auth-client";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes can't know the resolved theme until after hydration;
  // rendering the icon before then guarantees a mismatch warning and a
  // visible flicker of the wrong icon.
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--admin-fg-muted)] transition-colors hover:bg-[var(--admin-bg-subtle)] hover:text-[var(--admin-fg)]"
    >
      {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminTopbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const current =
    [...ADMIN_NAV_ITEMS].reverse().find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
    ) ?? ADMIN_NAV_ITEMS[0];

  async function handleSignOut() {
    await authClient.signOut();
    // Hard navigation, same reasoning as AuthForm's sign-in redirect —
    // guarantees the next request sees the now-cleared session cookie
    // instead of a cached pre-sign-out RSC payload.
    window.location.href = "/login";
  }

  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/95 px-4 backdrop-blur sm:px-6">
      <MobileSidebar />
      <h1 className="text-[15px] font-semibold text-[var(--admin-fg)]">{current.label}</h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Opens the same palette ⌘K does — a visible affordance for
            anyone who doesn't know the shortcut yet. */}
        <button
          type="button"
          onClick={() =>
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
            )
          }
          className="flex h-8 items-center gap-2 rounded-md border border-[var(--admin-border)] px-2.5 text-[12.5px] text-[var(--admin-fg-muted)] transition-colors hover:text-[var(--admin-fg)]"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-[var(--admin-border)] px-1 text-[10px] sm:inline">⌘K</kbd>
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-ring)]">
            <Avatar>
              {user?.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback>{user?.name ? initials(user.name) : <UserIcon className="h-4 w-4" />}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-[var(--admin-fg)]">{user?.name ?? "—"}</span>
              <span className="text-xs font-normal text-[var(--admin-fg-muted)]">{user?.email ?? ""}</span>
              {user?.role && (
                <span className="text-xs font-normal text-[var(--admin-primary)]">
                  {ROLE_LABELS[user.role as AppRole] ?? user.role}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut} variant="destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
